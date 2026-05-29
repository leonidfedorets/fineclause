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
    // Find all active templates due for generation
    const { data: templates, error: fetchError } = await supabase
      .from("recurring_invoice_templates")
      .select("*")
      .eq("is_active", true)
      .lte("next_generate_at", new Date().toISOString());

    if (fetchError) throw fetchError;
    if (!templates || templates.length === 0) {
      return new Response(JSON.stringify({ message: "No templates due", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const tpl of templates) {
      try {
        // Generate invoice via the existing generate-invoice function
        const { data: genData, error: genError } = await supabase.functions.invoke("generate-invoice", {
          headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          body: {
            invoice_type: tpl.invoice_type,
            seller_name: tpl.seller_name,
            seller_address: tpl.seller_address,
            seller_tax_id: tpl.seller_tax_id,
            seller_email: tpl.seller_email,
            client_name: tpl.client_name,
            client_email: tpl.client_email,
            client_address: tpl.client_address,
            client_tax_id: tpl.client_tax_id,
            items: tpl.items,
            tax_percent: Number(tpl.tax_percent),
            currency: tpl.currency,
            notes: tpl.notes,
            payment_method: tpl.payment_method,
            bank_account: tpl.bank_account,
            reverse_charge: tpl.reverse_charge,
            // Pass user_id so the function can attribute it
            _recurring_user_id: tpl.user_id,
          },
        });

        if (genError) throw genError;

        // Send email if configured
        if (tpl.send_on_generate && tpl.client_email && genData?.invoice?.id) {
          try {
            await supabase.functions.invoke("send-invoice-email", {
              headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
              body: { invoice_id: genData.invoice.id, recipient_email: tpl.client_email },
            });
          } catch (emailErr) {
            console.error(`Email send failed for template ${tpl.id}:`, emailErr);
          }
        }

        // Advance next_generate_at based on schedule_type
        const nextDate = new Date(tpl.next_generate_at);
        const scheduleType = tpl.schedule_type || "monthly";
        const interval = tpl.schedule_months_interval || 1;

        if (scheduleType === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (scheduleType === "biweekly") {
          nextDate.setDate(nextDate.getDate() + 14);
        } else {
          // monthly, quarterly, semiannual, yearly
          nextDate.setMonth(nextDate.getMonth() + interval);
        }

        await supabase
          .from("recurring_invoice_templates")
          .update({
            last_generated_at: new Date().toISOString(),
            next_generate_at: nextDate.toISOString(),
          })
          .eq("id", tpl.id);

        results.push({ template_id: tpl.id, status: "ok", invoice_id: genData?.invoice?.id });
      } catch (tplErr: any) {
        console.error(`Failed to process template ${tpl.id}:`, tplErr);
        results.push({ template_id: tpl.id, status: "error", error: tplErr.message });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("process-recurring-invoices error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
