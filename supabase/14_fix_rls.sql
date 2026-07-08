-- 14_fix_rls.sql
-- Fix disappearing history bug caused by "status = 'unlocked'" check

DROP POLICY IF EXISTS "Users can view scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can view own scan sessions" ON public.scan_sessions;

-- Yangi SELECT policy: Foydalanuvchi o'z yozuvlarini va tashkilot yozuvlarini ko'ra oladi (status shartisiz)
CREATE POLICY "Users can view scan sessions"
    ON public.scan_sessions FOR SELECT
    USING (
        auth.uid() = user_id OR 
        (org_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = public.scan_sessions.org_id AND user_id = auth.uid()))
    );
