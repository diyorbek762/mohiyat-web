-- 1. Create the document_rules table to store your codexes securely
CREATE TABLE IF NOT EXISTS public.document_rules (
    doc_type text PRIMARY KEY,
    rules_text text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.document_rules ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy so the API can read the rules anonymously or authenticated
DROP POLICY IF EXISTS "Anyone can read document rules" ON public.document_rules;
CREATE POLICY "Anyone can read document rules" 
ON public.document_rules 
FOR SELECT 
USING (true);

-- 4. Upsert (Insert or Update) all legal document rules
INSERT INTO public.document_rules (doc_type, rules_text) VALUES

('labor_code', '**O''ZBEKISTON RESPUBLIKASI MEHNAT KODEKSI (Qisqartirilgan Nazorat Ro''yxati)**
1. Kamsitish va Majburiy Mehnat: Mehnat va mashg''ulotlar sohasida kamsitish va majburiy mehnat qat''iyan taqiqlanadi.
2. Xodim Holatini Yomonlashtirmaslik: Shartnoma xodimning huquqiy holatini qonunchilikka nisbatan yomonlashtirmasligi kerak.
3. Soxta Shartnomalar Taqiqlanishi: Mehnat munosabatlarini yashirish uchun fuqarolik-huquqiy shartnomalar tuzish taqiqlanadi.
4. Yosh Senzi: Ishga qabul qilish 16 yoshdan, ota-ona roziligi bilan 15 yoshdan ruxsat etiladi.
5. Majburiy Shartlar: Shartnomada ish joyi, mehnat vazifasi, ish haqi miqdori, ish vaqti aniq ko''rsatilishi shart.'),

('housing_code', '**O''ZBEKISTON RESPUBLIKASI UY-JOY KODEKSI (Qisqartirilgan Nazorat Ro''yxati)**
1. Mulk Huquqining Daxlsizligi: Xususiy mulk bo''lgan turar joy asossiz olib qo''yilishi mumkin emas.
2. Bitimlarni Rasmiylashtirish: Oldi-sotdi, hadya, ayirboshlash shartnomalari notarial tasdiqlanishi va davlat ro''yxatidan o''tkazilishi shart.
3. Turar Joyni O''zgartirish: Sanoat ehtiyojlari uchun foydalanish taqiqlanadi. Noturar joyga o''tkazish hokim qarori bilan amalga oshiriladi.
4. Davlat Ehtiyojlari Uchun Buzish: Teng qimmatli boshqa turar joy yoki bozor qiymati (jumladan yer huquqi) to''liq qoplanishi shart.
5. Oila A''zolarining Huquqlari: Xususiylashtirilgan turar joy bilan bog''liq bitimlarda voyaga yetgan oila a''zolarining roziligi shart.'),

('tax_code', '**O''ZBEKISTON RESPUBLIKASI SOLIQ KODEKSI (Qisqartirilgan Nazorat Ro''yxati)**
1. Soliq To''lovchining Haqligi Prezumpsiyasi: Barcha qarama-qarshiliklar, ziddiyatlar va noaniqliklar faqatgina soliq to''lovchining foydasiga talqin etilishi qat''iy shart.
2. Qonunlarning Orqaga Qaytish Kuchi: Soliq to''lovchi holatini yomonlashtiruvchi hujjatlar orqaga qaytish kuchiga ega emas.
3. Kamsitishga Yo''l Qo''yilmasligi: Soliqlar kamsitish xususiyatiga ega bo''lishi, turlicha stavkalar belgilanishi qat''iyan taqiqlanadi.
4. Bitimlarning Iqtisodiy Mazmuni: Qalbaki va ko''zbo''yamachilik bitimlari soliq maqsadlarida inobatga olinmaydi.
5. Lozim Darajadagi Ehtiyotkorlik: Kontragent bilan shartnoma tuzishda uning ishonchliligi albatta tekshirilishi shart. Agar "lozim darajada ehtiyotkorlik" qilinmasa katta moliyaviy xavf yuzaga keladi.
6. Asossiz To''siqlar va Huquqni Himoya Qilish: Soliq organlari asossiz to''siqlar yaratishga haqli emas, qonunga zid talablarni bajarmaslik huquqi mavjud.
7. Soliq Sirini Saqlash: Tijorat siri va daromadlar soliq siri hisoblanadi va asossiz oshkor etilishi taqiqlanadi.'),

('civil_code', '**O''ZBEKISTON RESPUBLIKASI FUQAROLIK KODEKSI (Qisqartirilgan Nazorat Ro''yxati)**
1. Shartnoma Erkinligi: Tomonlar qonun hujjatlariga zid bo''lmagan shartnomalar tuzishda erkindirlar.
2. Majburiyatlarni Bajarish: Majburiyatlar lozim darajada va muddatida bajarilishi shart, bir tomonlama bosh tortish taqiqlanadi.
3. Zararni Qoplash: Huquqi buzilgan shaxs yetkazilgan haqiqiy zarar va boy berilgan foydani to''liq qoplanishini talab qilishga haqli.
4. Da''vo Muddati: Umumiy da''vo muddati 3 yil qilib belgilangan.
5. Bitim Haqiqiyligi: Qonunda ko''rsatilgan shaklga (yozma, notarial tasdiqlash, davlat ro''yxatidan o''tkazish) rioya qilinmasligi bitimni haqiqiy emas deb topishga olib keladi.'),

('business_law', '**XO''JALIK YURITUVCHI SUBYEKTLAR FAOLIYATINING SHARTNOMAVIY-HUQUQIY BAZASI TO''G''RISIDA (Qisqartirilgan Nazorat Ro''yxati)**
1. Shartnoma Tuzish Majburiyligi: Xo''jalik yurituvchi subyektlar tovarlar yetkazib berish va xizmatlar ko''rsatishni faqat yozma shartnoma asosida amalga oshirishlari shart.
2. Neustoyka (Penya va Jarimalar): Qonunda yoki shartnomada belgilangan majburiyatlarni buzganlik uchun jarima va penya undirilishi (masalan, to''lov kechiktirilganda har bir kun uchun 0.4%, lekin 50% dan oshmagan holda).
3. Talabnomalar Tartibi: Nizolarni sudgacha hal qilish uchun talabnoma (pretenziya) yuborish tartibi va unga 15 kun ichida javob berish majburiyati.
4. Sifat Kafolati: Yetkazib berilgan tovarlarning sifati va butligi standartlarga javob berishi shart.'),

('ecommerce_law', '**ELEKTRON TIJORAT TO''G''RISIDA (Qisqartirilgan Nazorat Ro''yxati)**
1. Elektron Shartnomalarning Qonuniyligi: Elektron hujjat shaklidagi shartnomalar qog''oz shaklidagi shartnomalarga tenglashtiriladi.
2. Iste''molchilar Huquqlari: Elektron tijoratda iste''molchilarning huquqlarini cheklovchi shartlar haqiqiy emas. Sotuvchi o''zining rekvizitlarini aniq ko''rsatishi shart.
3. Axborot Xavfsizligi: Elektron tijorat ishtirokchilarining shaxsiy ma''lumotlari va tijorat siri himoya qilinishi ta''minlanishi kerak.
4. Shartnoma Shartlari: Xaridor to''lov qilishdan oldin tovarning asosiy xususiyatlari, narxi va yetkazib berish shartlari bilan to''liq tanishish imkoniyatiga ega bo''lishi kerak.'),

('privacy_law', '**SHAXSGA DOIR MA''LUMOTLAR TO''G''RISIDA (Qisqartirilgan Nazorat Ro''yxati)**
1. Subyektning Roziligi: Shaxsga doir ma''lumotlarni yig''ish, saqlash va ishlov berish faqatgina subyektning ixtiyoriy roziligi asosida amalga oshiriladi.
2. Ma''lumotlar Bazalarini Ro''yxatdan O''tkazish: Shaxsga doir ma''lumotlar bazasi davlat reestridan o''tgan bo''lishi kerak.
3. Ma''lumotlarni Mahalliylashtirish: O''zbekiston fuqarolarining shaxsiy ma''lumotlari jismonan O''zbekiston hududida joylashgan serverlarda saqlanishi shart.
4. Maxfiylikni Ta''minlash: Ma''lumotlar egasi (operator) ularni uchinchi shaxslardan himoya qilish, ruxsatsiz tarqalishining oldini olish uchun zarur texnik va tashkiliy choralarni ko''rishi shart.'),

('trade_secret', '**TIJORAT SIRI TO''G''RISIDA (Qisqartirilgan Nazorat Ro''yxati)**
1. Rejimni Joriy Etish: Ma''lumotni tijorat siri deb hisoblash uchun korxonada tegishli rejim joriy etilgan bo''lishi, xodimlar bilan maxfiylik kelishuvi (NDA) imzolangan bo''lishi kerak.
2. Oshkor Etilmasligi: Davlat siri bo''lmagan, lekin tijorat ahamiyatiga ega bo''lgan ma''lumotlar qonunga xilof ravishda olinishi va oshkor etilishi taqiqlanadi.
3. Vakolatli Organlar: Davlat organlariga tijorat siri faqatgina qonunda aniq ko''rsatilgan asoslarga ko''ra (masalan, sud qarori, tergov) taqdim etiladi.
4. Zararni Qoplash: Tijorat sirini qonunga xilof ravishda oshkor etish natijasida yetkazilgan zarar to''liq hajmda qoplanishi kerak.'),

('consumer_rights', '**ISTE''MOLCHILAR HUQUQLARINI HIMOYA QILISH (Qisqartirilgan Nazorat Ro''yxati)**
1. Ma''lumot Olish: Iste''molchi tovar, ish, xizmat va ularning ishlab chiqaruvchisi haqida bepul, ishonchli va to''liq ma''lumot olish huquqiga ega.
2. Sifat va Kafolat: Iste''molchiga sifatli va xavfsiz tovarlar (xizmatlar) sotilishi kafolatlanadi. Nuqsonli tovar kafolat muddatida bepul almashtirib berilishi yoki puli qaytarilishi kerak.
3. Kamsituvchi Shartlar: Iste''molchi huquqlarini qonunchilikda belgilanganidan yomonlashtiruvchi yoki cheklovchi shartnoma shartlari haqiqiy emas deb topiladi.
4. Zararni Qoplash: Tovar nuqsonlari yoki noto''g''ri ma''lumot sababli yetkazilgan moddiy va ma''naviy zarar to''liq qoplab berilishi shart.'),

('constitution', '**O''ZBEKISTON RESPUBLIKASI KONSTITUTSIYASI (Qisqartirilgan Nazorat Ro''yxati)**
1. Inson Huquqlari Oliyligi: Inson, uning hayoti, erkinligi, sha''ni, qadr-qimmati va boshqa daxlsiz huquqlari oliy qadriyat hisoblanadi.
2. Mulk Daxlsizligi: Xususiy mulk daxlsizdir va u davlat tomonidan himoya qilinadi. Mulkdor o''z mol-mulkidan o''z xohishiga ko''ra erkin foydalanish huquqiga ega.
3. Mehnat va Himoya: Har bir shaxs munosib mehnat sharoitlariga, adolatli ish haqiga, shuningdek sud orqali o''z huquqlarini himoya qilishga haqli.
4. Tadbirkorlik Erkinligi: Qonunda belgilangan doirada iqtisodiy faoliyat, tadbirkorlik va erkin raqobat davlat tomonidan kafolatlanadi.')

ON CONFLICT (doc_type) DO UPDATE SET 
    rules_text = EXCLUDED.rules_text,
    updated_at = timezone('utc'::text, now());
