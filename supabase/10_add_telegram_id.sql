-- Telegram bot foydalanuvchilarini saytdagi profil bilan bog'lash uchun
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;
