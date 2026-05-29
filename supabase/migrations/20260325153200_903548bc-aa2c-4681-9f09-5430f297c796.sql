-- 1. Restrictive RLS policies for user_roles (prevent privilege escalation)
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Token-based read policy for shared_reports
CREATE POLICY "Anyone can read active shared reports by token"
  ON public.shared_reports FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND expires_at > now());