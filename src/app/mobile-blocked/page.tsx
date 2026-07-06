import { AlertTriangle, Monitor } from "lucide-react";

export default function MobileBlockedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none"></div>
      
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl max-w-md w-full relative z-10 border border-slate-100 flex flex-col items-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center shadow-inner transform rotate-3">
            <Monitor className="w-12 h-12 text-orange-500 transform -rotate-3" />
          </div>
          <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Faqat kompyuter uchun</h1>
        
        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
          Kechirasiz, katta hajmdagi PDF hujjatlarini yuklash va tahlil qilishda mobil qurilmalarda xotira yetishmovchiligi kuzatilgan. <br/><br/>
          Tizimdan foydalanish uchun <strong>noutbuk yoki kompyuterdan kiring.</strong>
        </p>

        <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Web Sayt Manzili</p>
          <div className="font-mono text-sm font-semibold text-blue-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
            mohiyat.vercel.app
          </div>
        </div>
      </div>
    </div>
  );
}
