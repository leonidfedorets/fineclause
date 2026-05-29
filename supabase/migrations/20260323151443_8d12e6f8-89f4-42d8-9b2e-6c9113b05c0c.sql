
-- Create storage bucket for contract templates
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-templates', 'contract-templates', true);

-- Allow anyone to read template files
CREATE POLICY "Public read access for templates" ON storage.objects FOR SELECT USING (bucket_id = 'contract-templates');

-- Only admins can upload/delete templates
CREATE POLICY "Admin upload templates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contract-templates' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete templates" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'contract-templates' AND public.has_role(auth.uid(), 'admin'));

-- Create contract_templates table
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates
CREATE POLICY "Anyone can view active templates" ON public.contract_templates FOR SELECT USING (is_active = true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage templates" ON public.contract_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
