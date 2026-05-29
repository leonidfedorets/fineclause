
-- Drop existing permissive INSERT/UPDATE/DELETE policies on user_roles
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

-- Recreate as restrictive policies that DENY all client-side modifications
-- Only service_role (server-side) can manage roles
-- No INSERT policy = default deny for all authenticated/anon users
-- Keep the SELECT policy so users can read their own roles
