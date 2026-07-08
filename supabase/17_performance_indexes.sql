-- =============================================================================
-- MOHIYAT AI — Performance Indexes (17)
-- =============================================================================

-- Add index to speed up fetching notifications for a specific user
CREATE INDEX IF NOT EXISTS idx_app_notifications_user_id ON public.app_notifications(user_id);

-- Add index to speed up fetching negotiation rooms for a specific session
CREATE INDEX IF NOT EXISTS idx_negotiation_rooms_session_id ON public.negotiation_rooms(session_id);

-- Add index for org_id in scan_sessions (useful for CRM dashboards)
CREATE INDEX IF NOT EXISTS idx_scan_sessions_org_id ON public.scan_sessions(org_id);
