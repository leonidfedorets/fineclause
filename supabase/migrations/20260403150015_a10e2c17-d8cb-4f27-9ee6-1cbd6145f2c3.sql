
ALTER TABLE public.recurring_invoice_templates 
  ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN schedule_weekday INTEGER,
  ADD COLUMN schedule_months_interval INTEGER NOT NULL DEFAULT 1;
