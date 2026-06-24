-- 1. Add is_admin to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. Hozirgi bor barcha foydalanuvchilarni Admin qilib qo'yish (Faqat siz bo'lsangiz kerak)
UPDATE public.profiles SET is_admin = true;

-- 3. Promocodes Table
CREATE TABLE IF NOT EXISTS public.promocodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  reward INTEGER NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Used Promocodes Tracker
CREATE TABLE IF NOT EXISTS public.used_promocodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  promocode_id UUID REFERENCES public.promocodes(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, promocode_id)
);

-- 5. App Alerts (Broadcasting)
CREATE TABLE IF NOT EXISTS public.app_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, warning, error, success
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RPC: Get All Users (Admin faqatgina ishlatadi, email qo'shilgan)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS json AS $$
DECLARE
  v_res json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'balance', p.balance,
      'email', au.email,
      'created_at', p.created_at
    ) ORDER BY p.created_at DESC
  ) INTO v_res
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id;
  
  RETURN COALESCE(v_res, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Add Coins (Admin birovga coin beradi)
CREATE OR REPLACE FUNCTION public.add_coins_to_user(target_id uuid, amount int)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles SET balance = balance + amount WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Redeem Promocode (Foydalanuvchi kod kiritadi)
CREATE OR REPLACE FUNCTION public.redeem_promocode(p_code text)
RETURNS json AS $$
DECLARE
  v_promo RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_promo FROM public.promocodes WHERE code = p_code AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promokod xato yoki yaroqsiz';
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RAISE EXCEPTION 'Promokod limiti tugagan';
  END IF;

  IF EXISTS (SELECT 1 FROM public.used_promocodes WHERE user_id = v_user_id AND promocode_id = v_promo.id) THEN
    RAISE EXCEPTION 'Bu promokoddan foydalangansiz';
  END IF;

  INSERT INTO public.used_promocodes (user_id, promocode_id) VALUES (v_user_id, v_promo.id);
  UPDATE public.promocodes SET used_count = used_count + 1 WHERE id = v_promo.id;
  UPDATE public.profiles SET balance = balance + v_promo.reward WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'reward', v_promo.reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Row Level Security (RLS) Qoidalari
ALTER TABLE public.promocodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage promocodes" ON public.promocodes;
CREATE POLICY "Admins can manage promocodes" ON public.promocodes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Anyone can view active alerts" ON public.app_alerts;
CREATE POLICY "Anyone can view active alerts" ON public.app_alerts FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage alerts" ON public.app_alerts;
CREATE POLICY "Admins can manage alerts" ON public.app_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Anyone can read document rules" ON public.document_rules;
CREATE POLICY "Anyone can read document rules" ON public.document_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage document rules" ON public.document_rules;
CREATE POLICY "Admins can manage document rules" ON public.document_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
