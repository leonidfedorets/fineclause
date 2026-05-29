-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to reset scan counters monthly
CREATE OR REPLACE FUNCTION public.reset_monthly_scan_counters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles SET free_scans_used = 0 WHERE free_scans_used > 0;
  RAISE LOG 'Monthly scan counter reset completed at %', now();
END;
$$;