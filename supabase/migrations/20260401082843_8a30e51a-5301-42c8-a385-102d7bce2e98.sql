-- Fix: Restrict cv_job_matches SELECT to employers who own the matched job
DROP POLICY IF EXISTS "Authenticated can view matches" ON public.cv_job_matches;

CREATE POLICY "Employers can view matches for their jobs"
ON public.cv_job_matches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.id = cv_job_matches.job_id
      AND jl.employer_id = auth.uid()
  )
);