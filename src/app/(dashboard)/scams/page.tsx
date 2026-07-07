"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Search, Filter, AlertTriangle, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScamsCollectionPage() {
  const [scams, setScams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchScams = async () => {
      const { data, error } = await supabase
        .from('scam_patterns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setScams(data);
      }
      setLoading(false);
    };
    
    fetchScams();
  }, []);

  const filteredScams = scams.filter(scam => {
    const matchesSearch = scam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          scam.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || scam.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="flex-1 bg-slate-50 min-h-full pb-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-8 pt-12 text-center md:text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-50 -mt-20 -mr-20 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold mb-4 border border-red-100">
              <ShieldAlert className="w-4 h-4" /> Firibgarliklar Bazasi
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Qora Ro'yxat (Watchlist)</h1>
            <p className="text-slate-500 max-w-xl text-sm md:text-base leading-relaxed">
              O'zbekistonda shartnomalar orqali qilingan eng mashhur va xavfli firibgarlik sxemalari bilan tanishing. O'zingizni va yaqinlaringizni himoya qiling.
            </p>
          </div>
          
          <button 
            onClick={() => router.push('/upload')}
            className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 w-full md:w-auto"
          >
            Hujjatni tekshirish <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Qidirish (masalan: novostroyka)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative w-full md:w-48 shrink-0">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <select 
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">Barcha xavflar</option>
              <option value="high">O'ta xavfli</option>
              <option value="medium">O'rtacha</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-500" />
            <p className="font-medium">Firibgarlik bazasi yuklanmoqda...</p>
          </div>
        ) : filteredScams.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Ma'lumot topilmadi</h3>
            <p className="text-slate-500">Bunday so'rov bo'yicha firibgarlik sxemasi bazada yo'q.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredScams.map((scam) => (
              <div key={scam.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col">
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mt-10 -mr-10 pointer-events-none transition-opacity group-hover:opacity-40 ${scam.severity === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${scam.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${scam.severity === 'high' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                    {scam.severity === 'high' ? "O'ta xavfli" : "O'rtacha"}
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-2 relative z-10 line-clamp-2">
                  {scam.title}
                </h3>
                
                <p className="text-slate-600 text-sm mb-6 flex-1 relative z-10">
                  {scam.description}
                </p>
                
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative z-10 mt-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hayotiy Misol</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 italic">
                    "{scam.real_example}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
