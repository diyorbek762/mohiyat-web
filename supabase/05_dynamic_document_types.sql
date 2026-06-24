-- =============================================================================
-- MOHIYAT AI — Dynamic Document Types Migration (05)
-- =============================================================================

-- 1. Add new columns to make document_rules fully dynamic
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_rules' AND column_name='label') THEN
    ALTER TABLE public.document_rules ADD COLUMN label TEXT DEFAULT 'Yangi Hujjat';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_rules' AND column_name='description') THEN
    ALTER TABLE public.document_rules ADD COLUMN description TEXT DEFAULT 'Hujjat tahlili qoidalari';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_rules' AND column_name='icon_name') THEN
    ALTER TABLE public.document_rules ADD COLUMN icon_name TEXT DEFAULT 'FileText';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_rules' AND column_name='color_gradient') THEN
    ALTER TABLE public.document_rules ADD COLUMN color_gradient TEXT DEFAULT 'from-slate-500 to-slate-700';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_rules' AND column_name='is_active') THEN
    ALTER TABLE public.document_rules ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 2. Backfill existing document types with UI metadata
UPDATE public.document_rules SET label = 'Fuqarolik Kodeksi', description = 'Umumiy shartnomaviy huquqiy munosabatlar', icon_name = 'Scale', color_gradient = 'from-blue-500 to-indigo-500' WHERE doc_type = 'civil_code';
UPDATE public.document_rules SET label = 'Soliq kodeksi', description = 'Soliq majburiyatlari va to''lovlar', icon_name = 'FileText', color_gradient = 'from-emerald-400 to-emerald-600' WHERE doc_type = 'tax_code';
UPDATE public.document_rules SET label = 'Mehnat Kodeksi', description = 'Xodim va ish beruvchi munosabatlari', icon_name = 'User', color_gradient = 'from-blue-400 to-blue-600' WHERE doc_type = 'labor_code';
UPDATE public.document_rules SET label = 'Uy Joy kodeksi', description = 'Uy-joy bilan bog''liq masalalar', icon_name = 'Home', color_gradient = 'from-orange-400 to-orange-600' WHERE doc_type = 'housing_code';
UPDATE public.document_rules SET label = 'Xo''jalik yurituvchi subyektlar', description = 'Shartnoma-huquqiy bazasi to''g''risida', icon_name = 'Building2', color_gradient = 'from-purple-500 to-purple-700' WHERE doc_type = 'business_law';
UPDATE public.document_rules SET label = 'Elektron tijorat to''g''risida', description = 'Onlayn savdo va xizmatlar', icon_name = 'Monitor', color_gradient = 'from-cyan-500 to-cyan-700' WHERE doc_type = 'ecommerce_law';
UPDATE public.document_rules SET label = 'Shaxsga doir ma''lumotlar', description = 'Maxfiylik va himoya qoidalari', icon_name = 'User', color_gradient = 'from-pink-500 to-pink-700' WHERE doc_type = 'privacy_law';
UPDATE public.document_rules SET label = 'Tijorat siri to''g''risida', description = 'Tijorat siri va NDA', icon_name = 'Lock', color_gradient = 'from-slate-600 to-slate-800' WHERE doc_type = 'trade_secret';
UPDATE public.document_rules SET label = 'Iste''molchilar huquqlari', description = 'Xaridor huquqlari va kafolat', icon_name = 'ShoppingCart', color_gradient = 'from-red-500 to-red-700' WHERE doc_type = 'consumer_rights';
UPDATE public.document_rules SET label = 'Konstitutsiya', description = 'Asosiy qonun va qoidalar', icon_name = 'Book', color_gradient = 'from-yellow-500 to-amber-600' WHERE doc_type = 'constitution';

-- Insert an 'other' default type if it doesn't exist
INSERT INTO public.document_rules (doc_type, label, description, icon_name, color_gradient, rules_text)
VALUES ('other', 'Boshqa hujjat', 'Umumiy huquqiy tahlil', 'File', 'from-slate-500 to-slate-700', 'Umumiy yuridik xavflarni va shartnoma standartlarini tekshiring.')
ON CONFLICT (doc_type) DO NOTHING;
