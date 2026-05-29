CREATE POLICY "Admins can read cv-uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cv-uploads'
  AND public.has_role(auth.uid(), 'admin')
);