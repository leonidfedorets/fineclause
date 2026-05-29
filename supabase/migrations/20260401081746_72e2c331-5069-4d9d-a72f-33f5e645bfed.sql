
-- Remove overly permissive INSERT policy that allows anon
DROP POLICY IF EXISTS "Anyone can post job listings" ON public.job_listings;

-- Recreate: only authenticated users can insert, and employer_id must match their user ID
CREATE POLICY "Authenticated users can post job listings"
ON public.job_listings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = employer_id);
