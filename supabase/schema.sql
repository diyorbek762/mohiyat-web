-- =============================================================================
-- MOHIYAT AI — Supabase Database Schema (Web MVP)
-- =============================================================================
-- This schema enforces the "Zero Trust Client" principle:
--   • full_report stays NULL until a confirmed payment exists.
--   • RLS policies act as the mathematical lock — no front-end spoofing
--     can bypass a database-level WHERE clause.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Enable required extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. PROFILES (extends Supabase auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT,
    phone           TEXT,
    avatar_url      TEXT,
    locale          TEXT DEFAULT 'uz',          -- uz | ru | en
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. LEGAL_BUNDLES (Static Reference — curated by Legal Lead)
-- ---------------------------------------------------------------------------
CREATE TABLE public.legal_bundles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain          TEXT NOT NULL,               -- 'lease', 'service', 'employment'
    article_ref     TEXT NOT NULL,               -- 'Civil Code Art. 539'
    title_uz        TEXT NOT NULL,
    title_ru        TEXT,
    content_uz      TEXT NOT NULL,
    content_ru      TEXT,
    risk_keywords   TEXT[] DEFAULT '{}',
    max_penalty_pct NUMERIC(5,2),
    effective_from  DATE,
    effective_to    DATE,                        -- NULL = currently in force
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_legal_bundles_domain ON public.legal_bundles(domain);

ALTER TABLE public.legal_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read legal bundles"
    ON public.legal_bundles FOR SELECT
    TO authenticated
    USING (true);

-- ---------------------------------------------------------------------------
-- 3. SCAN_SESSIONS (Paywall-locked core table)
-- ---------------------------------------------------------------------------
CREATE TABLE public.scan_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name       TEXT,
    file_hash       TEXT,                        -- SHA-256 for dedup
    page_count      INT DEFAULT 1,
    detected_domain TEXT,
    blind_spots     JSONB,                       -- The hook (always visible)
    risk_score      INT CHECK (risk_score BETWEEN 0 AND 100),
    short_title     TEXT,                        -- Automatically generated title by AI
    full_report     JSONB,                       -- THE LOCK: NULL until payment
    llm_model_used  TEXT,
    processing_ms   INT,
    share_token     TEXT UNIQUE,
    share_expires   TIMESTAMPTZ,
    status          TEXT DEFAULT 'processing'
                    CHECK (status IN ('processing', 'completed', 'failed', 'unlocked')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scan_sessions_user ON public.scan_sessions(user_id);
CREATE INDEX idx_scan_sessions_share ON public.scan_sessions(share_token)
    WHERE share_token IS NOT NULL;

ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan sessions"
    ON public.scan_sessions FOR SELECT
    USING (auth.uid() = user_id AND status = 'unlocked');

-- ---------------------------------------------------------------------------
-- 4. TRANSACTIONS (Payment ledger)
-- ---------------------------------------------------------------------------
CREATE TABLE public.transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id      UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL CHECK (provider IN ('payme', 'click', 'promo')),
    provider_txn_id TEXT,
    amount_uzs      BIGINT NOT NULL,
    currency        TEXT DEFAULT 'UZS',
    status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
    webhook_payload JSONB,
    confirmed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_session ON public.transactions(session_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_confirmed ON public.transactions(session_id)
    WHERE status = 'confirmed';

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. PAYWALL LOCK — RLS enforcement function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_confirmed_payment(p_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.transactions
        WHERE session_id = p_session_id AND status = 'confirmed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- 6. SECURE VIEW — nullifies full_report for unpaid sessions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.scan_sessions_secure AS
SELECT
    id, user_id, file_name, file_hash, page_count, detected_domain,
    blind_spots, risk_score, short_title,
    CASE WHEN public.has_confirmed_payment(id) THEN full_report ELSE NULL END AS full_report,
    llm_model_used, processing_ms,
    CASE WHEN public.has_confirmed_payment(id) THEN share_token ELSE NULL END AS share_token,
    share_expires,
    CASE WHEN public.has_confirmed_payment(id) THEN 'unlocked' ELSE status END AS status,
    created_at, updated_at
FROM public.scan_sessions
WHERE auth.uid() = user_id;

-- ---------------------------------------------------------------------------
-- 7. PUBLIC SHARE FUNCTION — read-only access via share_token (no auth)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_shared_report(p_share_token TEXT)
RETURNS TABLE (
    session_id UUID, file_name TEXT, detected_domain TEXT,
    blind_spots JSONB, risk_score INT, full_report JSONB, created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.file_name, s.detected_domain, s.blind_spots, s.risk_score, s.full_report, s.created_at
    FROM public.scan_sessions s
    WHERE s.share_token = p_share_token
      AND (s.share_expires IS NULL OR s.share_expires > now())
      AND public.has_confirmed_payment(s.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- 8. TRIGGERS: Auto-generate share_token on payment confirmation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_payment_confirmed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE public.scan_sessions SET
            share_token = encode(gen_random_bytes(12), 'base64'),
            share_expires = now() + INTERVAL '30 days',
            status = 'unlocked', updated_at = now()
        WHERE id = NEW.session_id;
        NEW.confirmed_at := now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_confirmed
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.on_payment_confirmed();

CREATE OR REPLACE FUNCTION public.on_payment_inserted_confirmed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' THEN
        UPDATE public.scan_sessions SET
            share_token = encode(gen_random_bytes(12), 'base64'),
            share_expires = now() + INTERVAL '30 days',
            status = 'unlocked', updated_at = now()
        WHERE id = NEW.session_id;
        NEW.confirmed_at := now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_insert_confirmed
    BEFORE INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.on_payment_inserted_confirmed();

-- ---------------------------------------------------------------------------
-- 9. SEED DATA: Example legal bundles
-- ---------------------------------------------------------------------------
INSERT INTO public.legal_bundles (domain, article_ref, title_uz, title_ru, content_uz, content_ru, risk_keywords, max_penalty_pct, effective_from)
VALUES
(
    'lease',
    'Fuqarolik Kodeksi, 539-modda',
    'Ijara haqi va to''lov muddatlari',
    'Арендная плата и сроки оплаты',
    'Ijara haqi miqdori va uni to''lash muddatlari shartnomada belgilanadi. Agar shartnomada ijara haqini to''lash muddati ko''rsatilmagan bo''lsa, ijara haqini belgilangan umumiy qoidalar tatbiq etiladi. Ijarachi ijara haqini o''z vaqtida to''lamagan taqdirda, ijaraga beruvchi shartnomani bekor qilishni talab qilishi mumkin.',
    'Размер арендной платы и сроки ее внесения определяются договором.',
    ARRAY['ijara', 'to''lov', 'penya', 'jarima', 'bekor qilish'],
    5.00, '1996-01-01'
),
(
    'service',
    'Fuqarolik Kodeksi, 703-modda',
    'Xizmat ko''rsatish shartnomasi bo''yicha javobgarlik',
    'Ответственность по договору оказания услуг',
    'Xizmat ko''rsatuvchi xizmatni shartnomada belgilangan muddatda va sifatda bajarishi shart.',
    'Исполнитель обязан оказать услугу в срок и качественно.',
    ARRAY['xizmat', 'sifat', 'muddat', 'javobgarlik', 'bekor qilish'],
    NULL, '1996-01-01'
),
(
    'employment',
    'Mehnat Kodeksi, 100-modda',
    'Mehnat shartnomasi shartlari',
    'Условия трудового договора',
    'Mehnat shartnomasi yozma shaklda tuzilishi kerak. Shartnomada ish joyi, lavozimi, ish haqi miqdori ko''rsatilishi lozim.',
    'Трудовой договор заключается в письменной форме.',
    ARRAY['mehnat', 'ish haqi', 'lavozim', 'ish vaqti', 'dam olish'],
    NULL, '1996-01-01'
);
