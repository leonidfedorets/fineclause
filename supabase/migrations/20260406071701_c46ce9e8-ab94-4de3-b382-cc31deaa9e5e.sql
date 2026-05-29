
CREATE TABLE public.tax_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'EU',
  tax_regime TEXT NOT NULL DEFAULT 'standard',
  gross_income NUMERIC NOT NULL DEFAULT 0,
  deductible_expenses NUMERIC NOT NULL DEFAULT 0,
  taxable_income NUMERIC NOT NULL DEFAULT 0,
  estimated_tax NUMERIC NOT NULL DEFAULT 0,
  effective_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  quarter_label TEXT NOT NULL DEFAULT '',
  ai_advice TEXT,
  vat_applicable BOOLEAN NOT NULL DEFAULT false,
  vat_rate NUMERIC NOT NULL DEFAULT 0,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax estimates" ON public.tax_estimates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tax estimates" ON public.tax_estimates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax estimates" ON public.tax_estimates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax estimates" ON public.tax_estimates FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_tax_estimates_updated_at BEFORE UPDATE ON public.tax_estimates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
