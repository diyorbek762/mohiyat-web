-- 1. Create a table to permanently track emails that have already received their free coins
CREATE TABLE IF NOT EXISTS public.claimed_free_coins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure the table so users cannot see or modify it
ALTER TABLE public.claimed_free_coins ENABLE ROW LEVEL SECURITY;

-- 2. Populate the table with all currently registered users so they don't get the bonus again if they delete their account
INSERT INTO public.claimed_free_coins (email)
SELECT email FROM auth.users WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- 3. Update the trigger function to check this table before giving coins
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  starting_balance INTEGER := 0;
BEGIN
  -- Check if this email has ever claimed free coins before
  IF NOT EXISTS (SELECT 1 FROM public.claimed_free_coins WHERE email = NEW.email) THEN
    -- First time user! Give them 3 coins and record their email permanently
    starting_balance := 3;
    INSERT INTO public.claimed_free_coins (email) VALUES (NEW.email);
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, avatar_url, balance)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    starting_balance
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
