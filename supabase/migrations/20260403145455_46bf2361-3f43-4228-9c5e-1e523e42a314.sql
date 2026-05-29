
CREATE TABLE public.recurring_invoice_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  schedule_day INTEGER NOT NULL DEFAULT 1,
  next_generate_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  last_generated_at TIMESTAMP WITH TIME ZONE,
  invoice_type TEXT NOT NULL DEFAULT 'recurring',
  currency TEXT NOT NULL DEFAULT 'EUR',
  tax_percent NUMERIC NOT NULL DEFAULT 0,
  reverse_charge BOOLEAN NOT NULL DEFAULT false,
  payment_method TEXT,
  bank_account TEXT,
  notes TEXT,
  seller_name TEXT,
  seller_address TEXT,
  seller_tax_id TEXT,
  seller_email TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  client_tax_id TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  send_on_generate BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON public.recurring_invoice_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON public.recurring_invoice_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.recurring_invoice_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.recurring_invoice_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);
