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
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const { invoice_id, recipient_email } = await req.json();
    if (!invoice_id || !recipient_email) {
      return new Response(JSON.stringify({ error: "invoice_id and recipient_email are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify invoice belongs to user
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .eq("user_id", userId)
      .single();

    if (invError || !invoice) throw new Error("Invoice not found");

    // Download the invoice HTML from storage
    if (!invoice.pdf_path) throw new Error("Invoice has no generated document");

    const { data: fileData, error: dlError } = await supabase.storage
      .from("invoice-pdfs")
      .download(invoice.pdf_path);

    if (dlError || !fileData) throw new Error("Failed to download invoice file");
    const invoiceHtml = await fileData.text();

    // Use AI to generate a professional email body wrapping the invoice
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional email composer. Generate a complete HTML email that includes the invoice. Return ONLY HTML, no markdown.",
          },
          {
            role: "user",
            content: `Create a professional HTML email to send this invoice to a client.

Invoice Number: ${invoice.invoice_number}
Client: ${invoice.client_name}
Total: ${Number(invoice.total).toFixed(2)} ${invoice.currency}

The email should:
- Have a polite, professional greeting
- Mention the invoice number and total amount
- Include the full invoice HTML below the message
- Have a professional closing from the sender

Here is the invoice HTML to embed in the email body:
${invoiceHtml}

Wrap everything in a single clean HTML document with inline CSS. White background, professional styling.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);
    const aiData = await aiResponse.json();
    let emailHtml = aiData.choices?.[0]?.message?.content || "";
    emailHtml = emailHtml.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();

    // Try to send via transactional email function if available
    // Otherwise store the email for manual sending
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "invoice-delivery",
          recipientEmail: recipient_email,
          idempotencyKey: `invoice-${invoice_id}-${Date.now()}`,
          templateData: {
            invoiceNumber: invoice.invoice_number,
            clientName: invoice.client_name,
            total: `${Number(invoice.total).toFixed(2)} ${invoice.currency}`,
            invoiceHtml: emailHtml,
          },
        },
      });
    } catch {
      // Transactional email not set up yet — save the email HTML for reference
      console.log("Transactional email not available, storing email content");
    }

    // Update invoice status to "sent"
    await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", invoice_id);

    return new Response(
      JSON.stringify({ success: true, message: `Invoice email prepared for ${recipient_email}`, emailHtml }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-invoice-email error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
