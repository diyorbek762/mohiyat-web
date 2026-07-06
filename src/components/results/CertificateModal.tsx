import React, { useState } from 'react';
import { X, Award, QrCode, Check, Share2, CheckCircle2 } from 'lucide-react';

export const CertificateModal = ({ isOpen, setIsOpen, sessionId, sessionData }: any) => {
  const [toast, setToast] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mohiyat AI - Shartnoma Sertifikati',
          text: 'Ushbu shartnoma Mohiyat AI orqali tekshirilgan va tasdiqlangan.',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors z-50 cursor-pointer"><X className="w-6 h-6" /></button>
        
        <div className="p-8 text-center relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <Award className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-2">Tasdiqlash Sertifikati</h2>
          <p className="text-sm text-slate-500 font-medium mb-8">Ushbu shartnoma "Mohiyat AI" yuridik algoritmlari orqali tekshirilgan va raqamli muhrlangan.</p>
          
          <div className="w-48 h-48 bg-white border-2 border-slate-100 p-4 rounded-3xl shadow-sm mb-6 flex items-center justify-center relative group">
            <div className="w-full h-full border border-slate-100 rounded-xl flex flex-col items-center justify-center bg-slate-50/50">
              <QrCode className="w-20 h-20 text-slate-800 opacity-80" />
              <p className="text-[10px] text-slate-400 mt-2 font-mono">{sessionId.split('-')[0]}</p>
            </div>
          </div>

          <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs text-slate-500">Status</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> Tasdiqlangan</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs text-slate-500">Shartnoma kodi</span>
              <span className="text-xs font-mono font-bold text-slate-700">{sessionId.split('-')[0].toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Sana</span>
              <span className="text-xs font-bold text-slate-700">{new Date(sessionData?.created_at || Date.now()).toLocaleDateString('uz-UZ')}</span>
            </div>
          </div>

          <div className="flex w-full gap-3">
            <button onClick={handleShare} className="flex-[0.3] py-3.5 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center relative overflow-hidden group">
              <Share2 className="w-5 h-5 group-active:scale-90 transition-transform" />
            </button>
            <button onClick={() => setIsOpen(false)} className="flex-[0.7] py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors">
              Yopish
            </button>
          </div>
        </div>
      </div>

      {/* Custom Toast Notification */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-full shadow-2xl transition-all duration-300 z-[200] ${toast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-bold tracking-wide">Sertifikat havolasi nusxalandi!</span>
      </div>
    </div>
  );
};
