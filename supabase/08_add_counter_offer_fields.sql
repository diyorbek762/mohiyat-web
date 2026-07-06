-- 08_add_counter_offer_fields.sql

-- 1. Add new fields to scan_sessions for Counter-Offer and Dual-Mode Results
ALTER TABLE public.scan_sessions
ADD COLUMN IF NOT EXISTS raw_text text, -- CIPHERTEXT (AES-256 encrypted at application level)
ADD COLUMN IF NOT EXISTS user_role text, -- User's role in the contract (e.g., Ijarachi, Pudratchi)
ADD COLUMN IF NOT EXISTS counter_offer_draft jsonb, -- The generated counter-offer letter
ADD COLUMN IF NOT EXISTS mohiyat_score_details jsonb, -- Breakdown of the 5 categories
ADD COLUMN IF NOT EXISTS parent_session_id uuid REFERENCES public.scan_sessions(id) ON DELETE SET NULL;

-- 2. Add RPC for decrementing a specific amount of coins
CREATE OR REPLACE FUNCTION public.decrement_coins_amount(amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET balance = balance - amount
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note on raw_text: 
-- This field MUST NEVER store plain text. It must be encrypted before inserting using 
-- a strong AES-256-GCM encryption key stored securely in Vercel environment variables.
-- The text is only decrypted temporarily in memory during API execution for AI agents.
