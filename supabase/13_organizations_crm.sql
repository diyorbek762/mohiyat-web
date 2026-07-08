-- 13_organizations_crm.sql
-- B2B Workspaces & CRM Extensions

-- 1. ORGANIZATIONS
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 50, -- Starting balance for companies
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. ORGANIZATION MEMBERS
CREATE TABLE public.organization_members (
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (org_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Policies for organizations
CREATE POLICY "Members can view their organizations"
    ON public.organizations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = id AND user_id = auth.uid()));

CREATE POLICY "Owners can update their organizations"
    ON public.organizations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = id AND user_id = auth.uid() AND role = 'owner'));

-- Policies for organization_members
CREATE POLICY "Members can view co-members"
    ON public.organization_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.organization_members AS om WHERE om.org_id = organization_members.org_id AND om.user_id = auth.uid()));

CREATE POLICY "Owners and Admins can insert members"
    ON public.organization_members FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members AS om WHERE om.org_id = org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

CREATE POLICY "Owners and Admins can delete members"
    ON public.organization_members FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.organization_members AS om WHERE om.org_id = org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

-- 3. SCAN_SESSIONS EXTESION FOR CRM AND ORGS
ALTER TABLE public.scan_sessions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.scan_sessions ADD COLUMN IF NOT EXISTS crm_counterparty TEXT;
ALTER TABLE public.scan_sessions ADD COLUMN IF NOT EXISTS crm_amount BIGINT;
ALTER TABLE public.scan_sessions ADD COLUMN IF NOT EXISTS crm_currency TEXT;
ALTER TABLE public.scan_sessions ADD COLUMN IF NOT EXISTS crm_deadline DATE;

-- Update scan_sessions RLS to include org access
DROP POLICY IF EXISTS "Users can view own scan sessions" ON public.scan_sessions;
CREATE POLICY "Users can view scan sessions"
    ON public.scan_sessions FOR SELECT
    USING (
        status = 'unlocked' AND (
            auth.uid() = user_id OR 
            (org_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = public.scan_sessions.org_id AND user_id = auth.uid()))
        )
    );

-- Allow inserting scan sessions with org_id (Supabase currently restricts inserts if RLS is enabled but no insert policy)
DROP POLICY IF EXISTS "Users can insert own scan sessions" ON public.scan_sessions;
CREATE POLICY "Users can insert scan sessions"
    ON public.scan_sessions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND 
        (org_id IS NULL OR EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = public.scan_sessions.org_id AND user_id = auth.uid()))
    );

-- 4. Helper RPC for Creating Organization
CREATE OR REPLACE FUNCTION public.create_organization(p_name TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  INSERT INTO public.organizations (name, balance)
  VALUES (p_name, 50)
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'owner');

  RETURN v_org_id;
END;
$$;

-- 5. Helper RPC for Shared Billing
CREATE OR REPLACE FUNCTION public.deduct_org_coins(p_org_id UUID, p_amount INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Ensure the user is part of the org
  IF EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = p_org_id AND user_id = auth.uid()) THEN
    UPDATE public.organizations SET balance = balance - p_amount WHERE id = p_org_id;
  ELSE
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;
END;
$$;
