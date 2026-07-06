"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Loader2, FileText, ArrowRight } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('scan_sessions')
          .select('id, short_title, created_at, risk_score, full_report')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (!error && data) {
              setHistoryRecords(data);
            }
            setIsLoadingHistory(false);
          });
      }
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative w-full h-full overflow-y-auto">
      <div className="bg-white/80 backdrop-blur-xl pt-6 pb-4 px-5 md:px-10 border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-sm sticky top-0">
        <div className="max-w-5xl mx-auto w-full">
          <h1 className="text-lg md:text-xl font-extrabold text-slate-800">Saqlangan Tahlillar</h1>
        </div>
      </div>
      
      <div className="flex-1 p-5 md:p-8">
        <div className="max-w-5xl mx-auto">
          {isLoadingHistory ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : historyRecords.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tarix bo'sh</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {historyRecords.map(record => (
                <div key={record.id} 
                     onClick={() => router.push(`/results/${record.id}`)}
                     className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{record.short_title || "Shartnoma"}</h3>
                      <p className="text-xs text-slate-500">{new Date(record.created_at).toLocaleString('uz-UZ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {record.full_report ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">Premium</span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Qulflangan</span>
                    )}
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
