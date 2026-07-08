-- 11_negotiation_rooms.sql
-- AI-Mediator: Multi-party negotiation rooms

-- ─────────────────────────────────────────────────
-- 1. NEGOTIATION_ROOMS — one room per negotiation
-- ─────────────────────────────────────────────────
DROP TABLE IF EXISTS public.negotiation_rooms CASCADE;
CREATE TABLE public.negotiation_rooms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
    initiator_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Guest access
    guest_token     TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
    guest_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_name      TEXT,

    -- Status machine
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','awaiting_confirmation','ai_drafting','completed','rejected')),

    -- Negotiation content
    demands         JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- demands format: [{risk_title, current_text, proposed_change}]

    responses       JSONB,
    -- responses format: [{demand_index, decision: "accept"|"reject"|"counter", counter_text?}]

    -- AI output
    ai_compromise   JSONB,
    -- ai_compromise: {clauses: [{demand_index, original, initiator_ask, guest_response, compromise, legal_basis}], summary}

    compromise_balance NUMERIC(5,2), -- initiator % (0-100)

    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_negotiation_rooms_session    ON public.negotiation_rooms(session_id);
CREATE INDEX idx_negotiation_rooms_initiator  ON public.negotiation_rooms(initiator_id);
CREATE INDEX idx_negotiation_rooms_token      ON public.negotiation_rooms(guest_token);
CREATE INDEX idx_negotiation_rooms_guest      ON public.negotiation_rooms(guest_user_id)
    WHERE guest_user_id IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_negotiation_rooms_updated_at
    BEFORE UPDATE ON public.negotiation_rooms
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────────────
ALTER TABLE public.negotiation_rooms ENABLE ROW LEVEL SECURITY;

-- Initiator can do everything on their own rooms
CREATE POLICY "Initiator full access"
    ON public.negotiation_rooms
    USING (auth.uid() = initiator_id)
    WITH CHECK (auth.uid() = initiator_id);

-- Guest (authenticated) can read room by guest_user_id match
CREATE POLICY "Guest can view own response room"
    ON public.negotiation_rooms FOR SELECT
    USING (auth.uid() = guest_user_id);

-- ─────────────────────────────────────────────────
-- 3. PUBLIC RPCs (SECURITY DEFINER — bypass RLS)
-- ─────────────────────────────────────────────────

-- Read a room by token (no auth required — for guest landing page)
CREATE OR REPLACE FUNCTION public.get_negotiation_room(p_token TEXT)
RETURNS TABLE (
    id UUID, session_id UUID, status TEXT,
    demands JSONB, responses JSONB,
    ai_compromise JSONB, compromise_balance NUMERIC,
    guest_user_id UUID, guest_name TEXT, created_at TIMESTAMPTZ,
    -- scan session summary for context
    file_name TEXT, risk_score INT, short_title TEXT,
    full_report_summary TEXT
)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id, r.session_id, r.status,
        r.demands, r.responses,
        r.ai_compromise, r.compromise_balance,
        r.guest_user_id, r.guest_name, r.created_at,
        s.file_name, s.risk_score, s.short_title,
        (s.full_report->>'overall_summary')::TEXT
    FROM public.negotiation_rooms r
    JOIN public.scan_sessions s ON s.id = r.session_id
    WHERE r.guest_token = p_token;
END;
$$;

-- Guest submits responses (no auth token required since we use SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.submit_guest_response(
    p_token       TEXT,
    p_responses   JSONB,
    p_guest_user_id UUID,
    p_guest_name  TEXT
)
RETURNS TEXT -- returns new status
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_room_id UUID;
    v_current_status TEXT;
BEGIN
    SELECT id, status INTO v_room_id, v_current_status
    FROM public.negotiation_rooms
    WHERE guest_token = p_token;

    IF v_room_id IS NULL THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    IF v_current_status NOT IN ('pending', 'rejected') THEN
        RAISE EXCEPTION 'Room is not accepting responses (status: %)', v_current_status;
    END IF;

    UPDATE public.negotiation_rooms
    SET
        responses     = p_responses,
        guest_user_id = p_guest_user_id,
        guest_name    = p_guest_name,
        status        = 'awaiting_confirmation',
        updated_at    = now()
    WHERE id = v_room_id;

    RETURN 'awaiting_confirmation';
END;
$$;

-- Initiator confirms or rejects (requires auth — called from API with service role)
CREATE OR REPLACE FUNCTION public.confirm_negotiation(
    p_room_id UUID,
    p_initiator_id UUID,
    p_approved BOOLEAN
)
RETURNS TEXT -- returns new status
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    SELECT status INTO v_current_status
    FROM public.negotiation_rooms
    WHERE id = p_room_id AND initiator_id = p_initiator_id;

    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Room not found or unauthorized';
    END IF;

    IF v_current_status != 'awaiting_confirmation' THEN
        RAISE EXCEPTION 'Room is not awaiting confirmation';
    END IF;

    IF p_approved THEN
        UPDATE public.negotiation_rooms
        SET status = 'ai_drafting', updated_at = now()
        WHERE id = p_room_id;
        RETURN 'ai_drafting';
    ELSE
        -- Regenerate token so guest cannot re-use old link
        UPDATE public.negotiation_rooms
        SET
            status      = 'rejected',
            guest_token = encode(gen_random_bytes(18), 'hex'),
            updated_at  = now()
        WHERE id = p_room_id;
        RETURN 'rejected';
    END IF;
END;
$$;

-- Append to 11_negotiation_rooms.sql
-- Helper RPC for deducting coins for a specific user (used by internal finalize API)
CREATE OR REPLACE FUNCTION public.deduct_coins_for_user(p_user_id UUID, p_amount INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET balance = balance - p_amount WHERE id = p_user_id;
END;
$$;
