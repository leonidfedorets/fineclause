-- 1. Drop the too-permissive shared_reports policy and rely on edge function (service role) instead
DROP POLICY "Anyone can read active shared reports by token" ON public.shared_reports;

-- 2. Fix profiles update policy to also lock is_blocked
DROP POLICY "Users can update own display_name" ON public.profiles;

CREATE POLICY "Users can update own display_name"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_pro = (SELECT p.is_pro FROM profiles p WHERE p.user_id = auth.uid())
    AND free_scans_used = (SELECT p.free_scans_used FROM profiles p WHERE p.user_id = auth.uid())
    AND is_blocked = (SELECT p.is_blocked FROM profiles p WHERE p.user_id = auth.uid())
  );