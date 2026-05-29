
CREATE TABLE public.carbon_footprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT 'other',
  period_label TEXT NOT NULL DEFAULT '',
  energy_kwh NUMERIC NOT NULL DEFAULT 0,
  travel_km NUMERIC NOT NULL DEFAULT 0,
  waste_kg NUMERIC NOT NULL DEFAULT 0,
  employees INTEGER NOT NULL DEFAULT 1,
  total_emissions_kg NUMERIC NOT NULL DEFAULT 0,
  offsets_kg NUMERIC NOT NULL DEFAULT 0,
  is_carbon_neutral BOOLEAN NOT NULL DEFAULT false,
  badge_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.carbon_footprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carbon footprints"
  ON public.carbon_footprints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own carbon footprints"
  ON public.carbon_footprints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carbon footprints"
  ON public.carbon_footprints FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own carbon footprints"
  ON public.carbon_footprints FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow public SELECT for shared badge viewing (by badge_token)
CREATE POLICY "Anyone can view by badge token"
  ON public.carbon_footprints FOR SELECT
  TO anon
  USING (is_carbon_neutral = true);

CREATE TRIGGER update_carbon_footprints_updated_at
  BEFORE UPDATE ON public.carbon_footprints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
