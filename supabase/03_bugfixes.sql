-- =============================================================================
-- MOHIYAT AI — Bug Fixes Migration (03)
-- =============================================================================
-- Barcha RLS muammolarini tuzatadi:
--   1. scan_sessions: INSERT policy + SELECT policyni kengaytirish
--   2. app_alerts: SELECT policyni umumiy qilish + REPLICA IDENTITY
--   3. used_promocodes: RLS yoqish + policy qo'shish
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. scan_sessions — RLS Fix
-- ---------------------------------------------------------------------------

-- Eski SELECT policyni o'chirish (status = 'unlocked' shartli)
DROP POLICY IF EXISTS "Users can view own scan sessions" ON public.scan_sessions;

-- Yangi SELECT policy: Foydalanuvchi o'z yozuvlarini ko'ra oladi (status shartisiz)
CREATE POLICY "Users can view own scan sessions"
    ON public.scan_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT policy: Foydalanuvchi faqat o'zi uchun yozuv yarata oladi
DROP POLICY IF EXISTS "Users can insert own scan sessions" ON public.scan_sessions;
CREATE POLICY "Users can insert own scan sessions"
    ON public.scan_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. app_alerts — RLS Fix + Realtime
-- ---------------------------------------------------------------------------

-- Eski cheklangan SELECT policyni o'chirish
DROP POLICY IF EXISTS "Anyone can view active alerts" ON public.app_alerts;

-- Yangi SELECT policy: Hamma barcha alertlarni ko'ra oladi (admin filtrlash uchun)
CREATE POLICY "Anyone can view alerts"
    ON public.app_alerts FOR SELECT
    USING (true);

-- Realtime uchun to'liq payload olish
ALTER TABLE public.app_alerts REPLICA IDENTITY FULL;

-- ---------------------------------------------------------------------------
-- 3. used_promocodes — RLS yoqish
-- ---------------------------------------------------------------------------

ALTER TABLE public.used_promocodes ENABLE ROW LEVEL SECURITY;

-- Foydalanuvchi o'z ishlatgan kodlarini ko'ra oladi
DROP POLICY IF EXISTS "Users can view own used promocodes" ON public.used_promocodes;
CREATE POLICY "Users can view own used promocodes"
    ON public.used_promocodes FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT faqat RPC orqali bo'ladi (SECURITY DEFINER), shuning uchun 
-- oddiy foydalanuvchiga to'g'ridan-to'g'ri INSERT kerak emas.
-- Agar kerak bo'lsa:
-- CREATE POLICY "Users can insert own used promocodes"
--     ON public.used_promocodes FOR INSERT
--     WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Profiles — Recursive policy tuzatish
-- ---------------------------------------------------------------------------

-- BU POLICYNI O'CHIRISH KERAK! profiles jadvalini o'zidan o'qib, 
-- recursive loop hosil qiladi va profileni butunlay buzadi.
-- Admin operatsiyalari get_all_users RPC (SECURITY DEFINER) orqali ishlaydi.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
