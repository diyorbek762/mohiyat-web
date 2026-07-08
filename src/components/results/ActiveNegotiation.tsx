import React, { useState } from 'react';
import { Check, X, MessageSquare, Loader2, Send } from 'lucide-react';

interface ActiveNegotiationProps {
  room: any;
  onConfirm: () => void;
  onReject: () => void;
  onCounterReply: (replies: Record<number, string>) => Promise<void>;
  confirmingRoom: boolean;
}

export function ActiveNegotiation({ room, onConfirm, onReject, onCounterReply, confirmingRoom }: ActiveNegotiationProps) {
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!room || room.status !== 'awaiting_confirmation') return null;

  const demands = room.demands || [];
  const responses = room.responses || [];

  const handleSendReplies = async () => {
    if (Object.keys(replies).length === 0) return;
    setSubmitting(true);
    try {
      await onCounterReply(replies);
      setReplies({});
    } finally {
      setSubmitting(false);
    }
  };

  const hasReplies = Object.keys(replies).length > 0;

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-black text-slate-800">Muzokara Taftish (Ping-Pong)</h3>
      <p className="text-sm text-slate-500 mb-4">Mehmonning javoblarini ko'rib chiqing. Qarshi takliflarga yangi javob yozishingiz yoki hammasini tasdiqlashingiz mumkin.</p>

      {demands.map((demand: any, i: number) => {
        const resp = responses.find((r: any) => r.demand_index === i);
        return (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-start gap-3">
              <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
              <div>
                <p className="text-sm font-bold text-slate-800">{demand.risk_title}</p>
                <p className="text-xs text-slate-500 mt-1">Sizning taklif: {demand.proposed_change}</p>
              </div>
            </div>

            {/* Discussion History */}
            {demand.discussion && demand.discussion.length > 0 && (
              <div className="px-5 py-3 bg-slate-50/50 space-y-2 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Oldingi yozishmalar</p>
                {demand.discussion.map((msg: any, idx: number) => (
                  <div key={idx} className={`flex flex-col ${msg.from === 'initiator' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-2 rounded-xl max-w-[80%] text-sm ${msg.from === 'initiator' ? 'bg-indigo-100 text-indigo-900 rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                      <span className="text-[10px] font-bold block mb-0.5 opacity-50">{msg.from === 'initiator' ? 'Siz' : room.guest_name || 'Mehmon'}</span>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Guest's latest response */}
            <div className="px-5 py-4">
              {!resp ? (
                <p className="text-sm text-slate-400 italic">Javob kutilmoqda...</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Mehmon qarori:</span>
                    {resp.decision === 'accept' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">✅ Qabul qildi</span>}
                    {resp.decision === 'reject' && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md">❌ Rad etdi</span>}
                    {resp.decision === 'counter' && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">🔄 Qarshi taklif</span>}
                  </div>
                  
                  {resp.decision === 'counter' && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                      <p className="text-sm font-medium text-amber-900">{resp.counter_text}</p>
                    </div>
                  )}

                  {resp.decision === 'counter' && (
                    <div className="mt-3">
                      <input 
                        type="text"
                        placeholder="Sizning yangi qarshi taklifingiz (ixtiyoriy)..."
                        value={replies[i] || ''}
                        onChange={(e) => setReplies(prev => ({ ...prev, [i]: e.target.value }))}
                        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
        {hasReplies ? (
          <button 
            onClick={handleSendReplies}
            disabled={submitting}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Yangi takliflarni yuborish
          </button>
        ) : (
          <>
            <button onClick={onReject} disabled={confirmingRoom} className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition disabled:opacity-50">
              Rad etish
            </button>
            <button onClick={onConfirm} disabled={confirmingRoom} className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-amber-700 transition disabled:opacity-50">
              {confirmingRoom && <Loader2 className="w-4 h-4 animate-spin" />}
              Tasdiqlash (AI Kompromiss)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
