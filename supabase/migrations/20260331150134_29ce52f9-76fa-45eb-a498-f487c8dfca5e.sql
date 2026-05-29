
-- Candidates table (anonymous, email-based)
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  location TEXT,
  consent_analysis BOOLEAN NOT NULL DEFAULT false,
  consent_recruiter_sharing BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '90 days')
);

-- CV uploads with AI analysis results
CREATE TABLE public.cv_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  ai_score INTEGER,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'EUR',
  skills TEXT[] DEFAULT '{}',
  experience_years NUMERIC(4,1),
  education_level TEXT,
  summary TEXT,
  raw_analysis JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job listings from employers
CREATE TABLE public.job_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employer_email TEXT NOT NULL,
  employer_name TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'EUR',
  location TEXT,
  remote_option TEXT DEFAULT 'on-site',
  experience_min NUMERIC(4,1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CV-to-job matches (auto-generated)
CREATE TABLE public.cv_job_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID NOT NULL REFERENCES public.cv_uploads(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0,
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  salary_fit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cv_id, job_id)
);

-- GDPR consent audit log
CREATE TABLE public.consent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Candidates: service-role only (managed by edge functions, not direct client access)
-- Authenticated users can view candidates who opted in to recruiter sharing (for agency dashboard)
CREATE POLICY "Admins can manage candidates" ON public.candidates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CV uploads: admins + authenticated users can view (for agency leads dashboard)
CREATE POLICY "Admins can manage cv_uploads" ON public.cv_uploads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view shared CVs" ON public.cv_uploads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = cv_uploads.candidate_id
        AND c.consent_recruiter_sharing = true
        AND c.expires_at > now()
    )
  );

-- Job listings: employers manage own, anyone authenticated can view active
CREATE POLICY "Employers can manage own listings" ON public.job_listings
  FOR ALL TO authenticated
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Authenticated can view active listings" ON public.job_listings
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Matches: viewable by authenticated users
CREATE POLICY "Authenticated can view matches" ON public.cv_job_matches
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage matches" ON public.cv_job_matches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Consent logs: admin only
CREATE POLICY "Admins can view consent logs" ON public.consent_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert consent logs" ON public.consent_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous inserts via service role (edge functions handle this)
-- For the public-facing CV upload, edge functions use service_role key

-- Updated_at triggers
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cv_uploads_updated_at
  BEFORE UPDATE ON public.cv_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON public.job_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for CV files
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-uploads', 'cv-uploads', false);

-- Storage RLS: only service role can manage CV files (edge functions handle uploads)
CREATE POLICY "Admins can manage CV files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'cv-uploads' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'cv-uploads' AND public.has_role(auth.uid(), 'admin'));
