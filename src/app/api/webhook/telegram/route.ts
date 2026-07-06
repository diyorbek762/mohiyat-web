import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Handle Callback Queries (Inline Button Clicks)
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;
      const data = body.callback_query.data;
      
      if (data === 'how_it_works') {
        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: `⚙️ <b>Qanday ishlaydi?</b>\n\n1️⃣ Siz menga shartnoma faylini yoki rasmini yuborasiz\n2️⃣ Men uni O'zbekiston qonunchiligiga asosan tahlil qilaman\n3️⃣ Sizga <b>Xavf darajasi (Mohiyat Score)</b> va eng xavfli bandlarni ko'rsataman.\n4️⃣ Zarur bo'lsa, qonuniy "Qarshi taklif" (Counter-Offer) yozib beraman.\n\n👇 <i>Hoziroq birorta fayl yuborib ko'ring!</i>`,
          parse_mode: 'HTML'
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Check if it's a message
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      const contact = body.message.contact;
      
      // Helper function to return direct webhook reply
      const replyDirectly = (replyText: string, options: any = {}) => {
        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: replyText,
          parse_mode: 'HTML',
          ...options
        });
      };

      // 1. Handle Contact Sharing (Auth flow)
      if (contact) {
         let phone = contact.phone_number;
         if (!phone.startsWith('+')) phone = '+' + phone;

         // Find if profile with this phone exists
         const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('phone', phone).single();
         
         if (profile) {
            // Update telegram_id
            await supabaseAdmin.from('profiles').update({ telegram_id: chatId }).eq('id', profile.id);
            return replyDirectly(`✅ <b>Profil muvaffaqiyatli bog'landi!</b>\n\nBalansingizda <b>${profile.balance || 0} ta coin</b> bor.\nEndi menga hujjat yuborishingiz mumkin.`, {
                reply_markup: { remove_keyboard: true }
            });
         } else {
            // Create a new user using Supabase Admin API
            const fakeEmail = `tg_${chatId}@mohiyat.ai`;
            const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
                email: fakeEmail,
                email_confirm: true,
                user_metadata: { full_name: contact.first_name || 'Telegram User', phone: phone }
            });

            if (error) {
                console.error("Auth error:", error);
                return replyDirectly(`❌ Tizimda xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.`);
            }

            // The trigger in SQL automatically creates a profile with 3 coins.
            if (newUser?.user) {
                // Update telegram_id on that auto-created profile
                await supabaseAdmin.from('profiles').update({ telegram_id: chatId }).eq('id', newUser.user.id);
                return replyDirectly(`🎉 <b>Yangi profil ochildi!</b>\n\nSizga tekinga <b>3 ta coin</b> berildi.\nEndi shartnoma (PDF, DOCX) yuboring.`, {
                   reply_markup: { remove_keyboard: true }
                });
            }
         }
      }

      // Handle /login command
      if (text && text.startsWith('/login')) {
         const parts = text.split(' ');
         if (parts.length === 3) {
            const email = parts[1];
            const password = parts[2];
            
            // Authenticate with Supabase
            const { data: authData, error } = await supabaseAdmin.auth.signInWithPassword({
              email,
              password
            });
            
            if (error || !authData.user) {
              return replyDirectly(`❌ Email yoki parol noto'g'ri. Qaytadan urinib ko'ring.`);
            }
            
            // Update telegram_id
            await supabaseAdmin.from('profiles').update({ telegram_id: chatId }).eq('id', authData.user.id);
            
            return replyDirectly(`✅ <b>Muvaffaqiyatli kirdingiz!</b>\n\nHisobingiz botga bog'landi. Davom etish uchun /start ni bosing.`, {
                reply_markup: { remove_keyboard: true }
            });
         } else {
            return replyDirectly(`Saytdagi hisobingizga kirish uchun quyidagi formatda yozing:\n\n<code>/login pochtangiz parolingiz</code>\n\n<i>Masalan: /login ali@mail.com 12345678</i>`);
         }
      }

      // 2. Auth Check - Look up user by telegram_id
      const { data: currentUser } = await supabaseAdmin.from('profiles').select('*').eq('telegram_id', chatId).single();

      if (!currentUser) {
         // User not linked
         return replyDirectly(`🛑 <b>Siz ro'yxatdan o'tmagansiz!</b>\n\nSaytdagi akkauntingizga kirish uchun <code>/login pochta parol</code> deb yozing yoki yangi profil ochish uchun raqamingizni yuboring.`, {
             reply_markup: {
                 keyboard: [[ { text: "📱 Telefon raqamni yuborish", request_contact: true } ]],
                 resize_keyboard: true,
                 one_time_keyboard: true
             }
         });
      }

      // Handle /start command (when user IS logged in)
      if (text === '/start') {
        return replyDirectly(
          `👋 Salom, <b>${currentUser.full_name || 'Foydalanuvchi'}</b>!\nSizning balansingiz: <b>${currentUser.balance || 0} ta coin</b>.\n\nMenga shartnoma yuboring (PDF, DOCX yoki Rasm) va men uni tahlil qilaman.\n\n🌐 Vebsaytimiz: <a href="https://mohiyat.vercel.app">mohiyat.vercel.app</a>`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🌐 Asosiy Saytga Kirish", url: "https://mohiyat.vercel.app" }],
                [{ text: "ℹ️ Qanday ishlaydi?", callback_data: "how_it_works" }]
              ]
            }
          }
        );
      }

      // 3. Handle document/photo & Coin logic
      if (body.message.document || body.message.photo) {
         if ((currentUser.balance || 0) <= 0) {
             return replyDirectly(`💸 <b>Balansingiz tugagan!</b>\n\nHujjatni tahlil qilish uchun kamida 1 coin kerak.\nIltimos, saytimiz orqali balansingizni to'ldiring:\n👉 <a href="https://mohiyat.vercel.app/profile">mohiyat.vercel.app/profile</a>`);
         }

         // Deduct 1 coin
         const newBalance = (currentUser.balance || 0) - 1;
         await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', currentUser.id);

         // Determine file ID and type
         const isPhoto = !!body.message.photo;
         const fileObj = isPhoto ? body.message.photo[body.message.photo.length - 1] : body.message.document;
         const fileId = fileObj.file_id;
         const fileName = isPhoto ? 'photo.jpg' : (fileObj.file_name || 'document.pdf');
         const mimeType = isPhoto ? 'image/jpeg' : (fileObj.mime_type || 'application/pdf');

         // Trigger background processing asynchronously (Fire and Forget)
         const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
         const host = req.headers.get('host');
         fetch(`${protocol}://${host}/api/webhook/telegram/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               chatId,
               fileId,
               fileName,
               mimeType,
               userId: currentUser.id
            })
         }).catch(err => console.error("Trigger background error:", err));

         return replyDirectly(`🔄 <b>Hujjat qabul qilindi!</b>\n<i>(1 coin yechildi. Qoldiq: ${newBalance} coin)</i>\n\nAI tahlilchini ishga tushirdim. Iltimos bir oz kuting, natijani shu yerga yuboraman...`);
      }

      // Default response
      return replyDirectly(`Iltimos, tahlil qilish uchun menga hujjat (PDF, Word) yoki rasm yuboring.`);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
