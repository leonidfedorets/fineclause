
-- 1. Fix profiles UPDATE policy: only allow display_name updates by users
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own display_name"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_pro = (SELECT p.is_pro FROM public.profiles p WHERE p.user_id = auth.uid())
  AND free_scans_used = (SELECT p.free_scans_used FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2. Add explicit deny UPDATE on scan_history
CREATE POLICY "Scans cannot be updated"
ON public.scan_history FOR UPDATE
TO authenticated
USING (false);
