-- 16_notifications.sql

-- 1. Create Notifications Table
CREATE TABLE public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications"
    ON public.app_notifications FOR SELECT
    USING (
        auth.uid() = user_id OR 
        (org_id IS NOT NULL AND public.is_org_member(org_id))
    );

CREATE POLICY "Users can update notifications"
    ON public.app_notifications FOR UPDATE
    USING (
        auth.uid() = user_id OR 
        (org_id IS NOT NULL AND public.is_org_member(org_id))
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        (org_id IS NOT NULL AND public.is_org_member(org_id))
    );

-- 2. Negotiation Rooms RLS Fix (to allow team members)
DROP POLICY IF EXISTS "Initiators can view own rooms" ON public.negotiation_rooms;

CREATE POLICY "Initiators and team can view rooms"
    ON public.negotiation_rooms FOR SELECT
    USING (
        auth.uid() = initiator_id OR 
        EXISTS (
            SELECT 1 FROM public.scan_sessions s 
            WHERE s.id = negotiation_rooms.session_id 
            AND s.org_id IS NOT NULL 
            AND public.is_org_member(s.org_id)
        )
    );

-- 3. Trigger for Negotiation Room Status Change
CREATE OR REPLACE FUNCTION public.notify_negotiation_status()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- We only want to notify when the status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Try to find if this belongs to an organization
    SELECT org_id INTO v_org_id FROM public.scan_sessions WHERE id = NEW.session_id;

    IF NEW.status = 'awaiting_confirmation' THEN
      INSERT INTO public.app_notifications (user_id, org_id, title, message, link_url)
      VALUES (
        NEW.initiator_id, 
        v_org_id, 
        'Muzokaraga javob keldi', 
        'Siz yuborgan havola orqali mehmon muzokaraga javob qaytardi. Tasdiqlashingiz kutilmoqda.', 
        '/results/' || NEW.session_id
      );
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO public.app_notifications (user_id, org_id, title, message, link_url)
      VALUES (
        NEW.initiator_id, 
        v_org_id, 
        'Kompromiss tayyor', 
        'AI ikkala tomon talablari asosida adolatli kompromiss hujjatini shakllantirdi.', 
        '/results/' || NEW.session_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_negotiation_status ON public.negotiation_rooms;
CREATE TRIGGER trg_negotiation_status
  AFTER UPDATE OF status ON public.negotiation_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_negotiation_status();

-- Ensure realtime is enabled for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE app_notifications;
