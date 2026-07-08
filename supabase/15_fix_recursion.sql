-- 15_fix_recursion.sql
-- Fix infinite recursion in RLS

-- 1. Create a SECURITY DEFINER function to check membership safely
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$;

-- 2. Fix the recursive policy on organization_members
DROP POLICY IF EXISTS "Members can view co-members" ON public.organization_members;

CREATE POLICY "Members can view co-members"
    ON public.organization_members FOR SELECT
    USING (public.is_org_member(org_id));

-- 3. Use the safe function in scan_sessions
DROP POLICY IF EXISTS "Users can view scan sessions" ON public.scan_sessions;

CREATE POLICY "Users can view scan sessions"
    ON public.scan_sessions FOR SELECT
    USING (
        auth.uid() = user_id OR 
        (org_id IS NOT NULL AND public.is_org_member(org_id))
    );
