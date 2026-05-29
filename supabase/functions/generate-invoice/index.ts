import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    // Support service-role calls from recurring invoice cron
    const body = await req.json();
    let userId: string;
    if (userError || !userData.user) {
      if (body._recurring_user_id && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
        userId = body._recurring_user_id;
      } else {
        throw new Error("Not authenticated");
      }
    } else {
      userId = userData.user.id;
    }

    // body already parsed above
    const {
      invoice_type, invoice_number: customNumber,
      issue_date, due_date,
      seller_name, seller_address, seller_tax_id, seller_email,
      client_name, client_email, client_address, client_tax_id,
      items, tax_percent, currency, notes,
      payment_method, bank_account, reverse_charge, original_invoice_ref,
    } = body;

    if (!client_name || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "client_name and items are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity || 1) * (item.price || 0), 0);
    const taxPct = tax_percent || 0;
    const taxAmount = subtotal * (taxPct / 100);
    const total = subtotal + taxAmount;

    const now = new Date();
    const invoiceNumber = customNumber || `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const typeLabel = {
      standard: "Invoice", proforma: "Proforma Invoice", credit_note: "Credit Note",
      debit_note: "Debit Note", corrective: "Corrective Invoice", advance: "Advance Invoice",
      final: "Final Invoice", recurring: "Recurring Invoice", receipt: "Receipt", vat: "VAT Invoice",
    }[invoice_type || "standard"] || "Invoice";

    const aiPrompt = `Generate a professional HTML document for a ${typeLabel}. Return ONLY the HTML, no markdown.

Document Number: ${invoiceNumber}
Type: ${typeLabel}
Issue Date: ${issue_date || now.toLocaleDateString("en-GB")}
${due_date ? `Due Date: ${due_date}` : ""}
Currency: ${currency || "EUR"}
${original_invoice_ref ? `Refers to original invoice: ${original_invoice_ref}` : ""}

${seller_name ? `FROM (Seller):
Name: ${seller_name}
${seller_tax_id ? `Tax ID: ${seller_tax_id}` : ""}
${seller_email ? `Email: ${seller_email}` : ""}
${seller_address ? `Address: ${seller_address}` : ""}` : "FROM: FineClause User"}

TO (Buyer):
Name: ${client_name}
${client_tax_id ? `Tax ID: ${client_tax_id}` : ""}
${client_email ? `Email: ${client_email}` : ""}
${client_address ? `Address: ${client_address}` : ""}

Items:
${items.map((i: any) => `- ${i.description}: ${i.quantity || 1} ${i.unit || "pcs"} × ${(i.price || 0).toFixed(2)} ${currency || "EUR"}${i.tax_rate != null ? ` (${i.tax_rate}% VAT)` : ""}`).join("\n")}

Subtotal: ${subtotal.toFixed(2)} ${currency || "EUR"}
Tax (${taxPct}%): ${taxAmount.toFixed(2)} ${currency || "EUR"}
Total: ${total.toFixed(2)} ${currency || "EUR"}

${reverse_charge ? "⚠ REVERSE CHARGE: VAT is to be accounted for by the recipient under the reverse charge mechanism (Art. 196 EU VAT Directive)." : ""}
${payment_method ? `Payment Method: ${payment_method}` : ""}
${bank_account ? `Bank Account / IBAN: ${bank_account}` : ""}
${notes ? `Notes: ${notes}` : ""}

Style with clean, professional inline CSS. White background, proper table with columns for description/quantity/unit/unit price/amount, clear headers, European business document styling. Include the document type prominently in the header.`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an invoice formatting assistant. Generate clean, professional HTML invoices for European businesses. Support all invoice types (standard, proforma, credit note, corrective, VAT, etc). Return only HTML." },
          { role: "user", content: aiPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);
    const aiData = await aiResponse.json();
    let invoiceHtml = aiData.choices?.[0]?.message?.content || "";
    invoiceHtml = invoiceHtml.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();

    const filePath = `${userId}/${invoiceNumber}.html`;
    const { error: uploadError } = await supabase.storage
      .from("invoice-pdfs")
      .upload(filePath, new Blob([invoiceHtml], { type: "text/html" }), { contentType: "text/html", upsert: true });

    if (uploadError) throw new Error("Failed to upload invoice");

    const { data: invoice, error: dbError } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        client_name,
        client_email: client_email || null,
        client_address: client_address || null,
        items,
        subtotal,
        tax_percent: taxPct,
        tax_amount: taxAmount,
        total,
        currency: currency || "EUR",
        status: "generated",
        notes: notes || null,
        pdf_path: filePath,
      })
      .select()
      .single();

    if (dbError) throw new Error("Failed to save invoice");

    return new Response(
      JSON.stringify({ invoice, html: invoiceHtml }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("generate-invoice error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
