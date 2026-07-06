import React from 'react';
import { X, PenTool, CheckCircle2, AlertTriangle, Coins, Loader2 } from 'lucide-react';

export const CounterOfferModal = ({ 
  isOpen, 
  setIsOpen, 
  blindSpots, 
  coSelectedRisks, 
  setCoSelectedRisks, 
  coTone, 
  setCoTone, 
  coError, 
  coGenerating, 
  handleGenerateCounterOffer 
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><PenTool className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-slate-800">Qarshi Taklif Yozish</h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <p className="text-sm text-slate-600 mb-6 font-medium">AI yordamida qonuniy asoslangan rasmiy rad javobi yoki qarshi taklif yarating. Qaysi xavflar bo'yicha e'tiroz bildirmoqchisiz?</p>
          
          <div className="space-y-3 mb-8">
            {blindSpots.length === 0 ? (
              <p className="text-slate-500 text-sm">Xavflar topilmadi.</p>
            ) : (
              blindSpots.map((spot: any, i: number) => {
                const isSelected = coSelectedRisks.includes(spot.title);
                const toggleRisk = () => {
                  setCoSelectedRisks((prev: string[]) => 
                    prev.includes(spot.title) ? prev.filter(t => t !== spot.title) : [...prev, spot.title]
                  );
                };

                return (
                  <div 
                    key={i} 
                    onClick={toggleRisk}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-100'}`}
                  >
                    <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{spot.title}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{spot.recommendation}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <h3 className="font-bold text-slate-800 mb-3 text-sm">Xat ohangi (Tone):</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'professional', label: 'Professional', desc: 'Sipo va qonuniy' },
              { id: 'friendly', label: 'Do\'stona', desc: 'Kompromissga moyil' },
              { id: 'aggressive', label: 'Qat\'iy', desc: 'Keskin himoya' }
            ].map(t => (
              <div 
                key={t.id} 
                onClick={() => setCoTone(t.id as any)}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${coTone === t.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-100'}`}
              >
                <p className={`text-sm font-bold ${coTone === t.id ? 'text-indigo-700' : 'text-slate-700'}`}>{t.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
              </div>
            ))}
          </div>

          {coError && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-sm text-red-700 font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{coError}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold text-slate-700">Narxi: <span className="text-amber-600">3 Coin</span></span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">Bekor qilish</button>
            <button 
              onClick={handleGenerateCounterOffer}
              disabled={coGenerating || coSelectedRisks.length === 0}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
            >
              {coGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Yozilmoqda...</> : 'Yaratish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
