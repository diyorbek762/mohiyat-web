import React, { useState } from 'react';

export const AnalysisCard = ({ title, icon: Icon, colorTheme, sectionRef, legalBasis, recommendation }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const themeStyles: Record<string, any> = {
    blue: { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50/50', border: 'border-purple-100', text: 'text-purple-700', iconBg: 'bg-purple-100' },
    orange: { bg: 'bg-orange-50/50', border: 'border-orange-100', text: 'text-orange-700', iconBg: 'bg-orange-100' },
    red: { bg: 'bg-red-50/50', border: 'border-red-100', text: 'text-red-700', iconBg: 'bg-red-100' },
    green: { bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    gold: { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100' },
  };

  const style = themeStyles[colorTheme] || themeStyles.blue;

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${style.iconBg} shrink-0`}>
          <Icon className={`w-5 h-5 ${style.text}`} strokeWidth={2.5} />
        </div>
        <h3 className={`font-bold text-base leading-snug ${style.text}`}>{title}</h3>
      </div>
      {sectionRef && (
        <p className="text-xs text-slate-500 font-medium mb-2">
          <span className="font-bold text-slate-600">Bo'lim:</span> {sectionRef}
        </p>
      )}
      {recommendation && (
        <p className="text-sm text-slate-700 font-medium leading-relaxed mb-3">{recommendation}</p>
      )}
      {legalBasis && (
        <>
          {isExpanded && (
            <div className="mb-3 bg-white/80 rounded-xl p-3 border border-slate-100 animate-in fade-in duration-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📜 Qonuniy asos</p>
              <p className="text-sm text-slate-700 font-semibold">{legalBasis}</p>
            </div>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-auto"
          >
            {isExpanded ? 'Yopish' : 'Qonuniy asosni ko\'rish'}
          </button>
        </>
      )}
    </div>
  );
};
