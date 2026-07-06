"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Coins, LogOut, Trash2, Loader2 } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import CustomDialog from "@/components/CustomDialog";
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Dialog States
  const [promoDialog, setPromoDialog] = useState({ isOpen: false });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false });
  const [buyCoinsDialog, setBuyCoinsDialog] = useState({ isOpen: false });
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, title: '', msg: '' });
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, msg: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            setUserProfile(data);
            setName(data.full_name || '');
            setPhone(data.phone || '');
          }
        });
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ full_name: name, phone: phone }).eq('id', user?.id);
    setSaving(false);
    setIsEditing(false);
    window.location.reload(); 
  };

  const handleDelete = () => setDeleteDialog({ isOpen: true });

  const handleConfirmDelete = async () => {
    setDeleteDialog({ isOpen: false });
    await supabase.rpc('delete_user');
    supabase.auth.signOut().then(() => router.push('/login'));
  };

  const handleRedeemPromo = () => setPromoDialog({ isOpen: true });

  const handleConfirmPromo = async (code?: string) => {
    if (!code) return;
    try {
      const { data, error } = await supabase.rpc('redeem_promocode', { p_code: code.toUpperCase() });
      if (error) throw error;
      setPromoDialog({ isOpen: false });
      setSuccessDialog({ isOpen: true, title: 'Muvaffaqiyatli!', msg: `Tabriklaymiz! Sizga ${data.reward} Coin berildi!` });
    } catch (e: any) {
      setPromoDialog({ isOpen: false });
      setErrorDialog({ isOpen: true, msg: e.message });
    }
  };

  if (!userProfile) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative w-full h-full overflow-y-auto">
      <div className="bg-white/80 backdrop-blur-xl pt-6 pb-4 px-5 md:px-10 border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-sm sticky top-0">
        <div className="max-w-5xl mx-auto w-full">
          <h1 className="text-lg md:text-xl font-extrabold text-slate-800">Shaxsiy Profil</h1>
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8">
        <div className="max-w-xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between mb-8 bg-amber-50 p-4 rounded-2xl border border-amber-100 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl shadow-sm"><Coins className="text-amber-500 w-6 h-6" /></div>
              <div>
                <p className="text-xs text-amber-700 font-bold uppercase">Tangalar</p>
                <p className="text-xl font-black text-amber-900">{userProfile?.balance ?? 0} Coin</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleRedeemPromo} className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-100 transition-colors">Promokod</button>
              <button onClick={() => setBuyCoinsDialog({ isOpen: true })} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-amber-600 transition-colors">To'ldirish</button>
            </div>
          </div>

          <div className="w-full space-y-4 mb-10">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Ism va familiya</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium disabled:opacity-70 disabled:bg-slate-100" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Telefon raqam</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-slate-400" /></div>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEditing} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium disabled:opacity-70 disabled:bg-slate-100" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Elektron pochta</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                <input type="email" value={user?.email || ''} disabled className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-medium opacity-70 cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="w-full flex gap-3 mb-10">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Bekor qilish</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Saqlash"}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-md">Ma'lumotlarni tahrirlash</button>
            )}
          </div>

          <div className="w-full border-t border-slate-100 pt-8 flex flex-col gap-3">
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200"
            >
              <LogOut className="w-5 h-5" /> Tizimdan chiqish
            </button>

            <button 
              onClick={handleDelete}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors border border-red-100 mt-4"
            >
              <Trash2 className="w-5 h-5" /> Akkauntni butunlay o'chirish
            </button>
          </div>
        </div>
      </div>

      <CustomDialog 
        isOpen={buyCoinsDialog.isOpen}
        type="confirm"
        theme="amber"
        title="Tangalar sotib olish"
        description="Tangalar sotib olish yoki so'rash uchun loyiha asoschisi (@d1yorbek19) ga Telegram orqali murojaat qiling."
        confirmText="Telegramga o'tish"
        onClose={() => setBuyCoinsDialog({ isOpen: false })}
        onConfirm={() => {
          setBuyCoinsDialog({ isOpen: false });
          window.open("https://t.me/d1yorbek19", "_blank");
        }}
      />

      <CustomDialog 
        isOpen={promoDialog.isOpen}
        type="prompt"
        theme="blue"
        title="Promokod"
        description="Sizda promokod bormi? Uni kiriting va bepul coinlarga ega bo'ling."
        placeholder="PROMO2026"
        onClose={() => setPromoDialog({ isOpen: false })}
        onConfirm={handleConfirmPromo}
      />
      
      <CustomDialog 
        isOpen={deleteDialog.isOpen}
        type="confirm"
        theme="red"
        title="Akkauntni o'chirish"
        description="Rostdan ham akkauntingizni butunlay o'chirmoqchimisiz? Barcha ma'lumotlar o'chib ketadi va ortga qaytarib bo'lmaydi."
        confirmText="O'chirish"
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={handleConfirmDelete}
      />

      <CustomDialog 
        isOpen={successDialog.isOpen}
        type="alert"
        theme="green"
        title={successDialog.title}
        description={successDialog.msg}
        onClose={() => { setSuccessDialog({ isOpen: false, title: '', msg: '' }); window.location.reload(); }}
        onConfirm={() => { setSuccessDialog({ isOpen: false, title: '', msg: '' }); window.location.reload(); }}
      />

      <CustomDialog 
        isOpen={errorDialog.isOpen}
        type="alert"
        theme="red"
        title="Xatolik"
        description={errorDialog.msg}
        onClose={() => setErrorDialog({ isOpen: false, msg: '' })}
        onConfirm={() => setErrorDialog({ isOpen: false, msg: '' })}
      />
    </div>
  );
}
