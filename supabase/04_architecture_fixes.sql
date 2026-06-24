-- =============================================================================
-- MOHIYAT AI — Architecture & Security Fixes (04)
-- =============================================================================

-- 1. Balance Constraint: Tangalar manfiy bo'lishini taqiqlash
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_balance_positive'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_balance_positive CHECK (balance >= 0);
  END IF;
END $$;

-- 2. Atomic Coin Deduction RPC (Race-condition oldini olish uchun)
CREATE OR REPLACE FUNCTION public.decrement_coins()
RETURNS void AS $$
BEGIN
  -- Foydalanuvchi hisobidan 1 tanga ayirish. Agar balance 0 bo'lsa, xato beradi (CHECK constraint orqali)
  UPDATE public.profiles
  SET balance = balance - 1
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Promocode Case Sensitivity Fix
-- Kodni katta harfga o'tkazib va bo'sh joylarni tozalab tekshiradi
CREATE OR REPLACE FUNCTION public.redeem_promocode(p_code text)
RETURNS json AS $$
DECLARE
  v_promo RECORD;
  v_user_id UUID;
  v_clean_code TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_clean_code := TRIM(UPPER(p_code));

  SELECT * INTO v_promo FROM public.promocodes WHERE TRIM(UPPER(code)) = v_clean_code AND is_active = true;
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
