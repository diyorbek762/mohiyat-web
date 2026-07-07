-- Eski xato qoidani o'chirib tashlaymiz
DROP POLICY IF EXISTS "Allow authenticated full access" ON scam_patterns;

-- Yangi to'g'rilangan qoidani qo'shamiz (INSERT, UPDATE, DELETE uchun to'liq huquq)
CREATE POLICY "Allow all actions for authenticated users" 
ON scam_patterns 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
