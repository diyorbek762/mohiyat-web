"use client";

import React, { useState, useEffect, use, useRef } from 'react';
import { ArrowRight, ThumbsUp, ThumbsDown, Sparkles, FileText, AlertTriangle, Coins, Shield, ListTodo, Award, Lock, Loader2, QrCode, PenTool, Clock, CheckCircle2, MessageSquare, Send, Check } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { AnalysisCard } from '@/components/results/AnalysisCard';
import { CertificateModal } from '@/components/results/CertificateModal';
import { ChatModal } from '@/components/results/ChatModal';
import { CounterOfferModal } from '@/components/results/CounterOfferModal';

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  // Counter Offer State
  const [coModalOpen, setCoModalOpen] = useState(false);
  const [coSelectedRisks, setCoSelectedRisks] = useState<string[]>([]);
  const [coTone, setCoTone] = useState<'professional'|'aggressive'|'friendly'>('professional');
  const [coGenerating, setCoGenerating] = useState(false);
  const [coDraft, setCoDraft] = useState<string | null>(null);
  const [coError, setCoError] = useState<string | null>(null);

  // Chat State
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // QR Certificate State
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      supabase
        .from('scan_sessions')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setSessionData(data);
            setScanResult({
              risk_score: data.risk_score || 0,
              blind_spots: data.full_report?.blind_spots || [],
              summary: data.full_report?.overall_summary || data.short_title || "Tahlil natijasi",
              is_scam: data.full_report?.is_scam || false,
              scam_details: data.full_report?.scam_details || "",
            });
            // Look for existing draft
            if (data.counter_offer_draft && data.counter_offer_draft.length > 0) {
               setCoDraft(data.counter_offer_draft[data.counter_offer_draft.length - 1].draft);
            }
            
            // Load Chat History
            supabase.from('chat_messages')
              .select('*')
              .eq('session_id', resolvedParams.id)
              .order('created_at', { ascending: true })
              .then(({ data: chatData }) => {
                if (chatData) setChatMessages(chatData);
                setLoading(false);
              });
          } else {
            setLoading(false);
          }
        });
    });
  }, [resolvedParams.id, router]);

  const handleGenerateCounterOffer = async () => {
    if (coSelectedRisks.length === 0) {
      setCoError("Kamida bitta xavfni tanlang.");
      return;
    }
    setCoGenerating(true);
    setCoError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/counter-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ session_id: resolvedParams.id, selected_risks: coSelectedRisks, tone: coTone })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Server javob bermadi (Timeout). Iltimos qayta urinib ko'ring.");
      }
      
      if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");
      
      setCoDraft(data.draft);
      setCoModalOpen(false);
      posthog?.capture('counter_offer_generated');
    } catch(err: any) {
      setCoError(err.message);
    } finally {
      setCoGenerating(false);
    }
  };

  const toggleRiskSelection = (title: string) => {
    setCoSelectedRisks(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ session_id: resolvedParams.id, message: userMsg.content })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Server javob bermadi (Timeout).");
      }
      
      if (!res.ok) throw new Error(data.error);

      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.response }]);
    } catch(err: any) {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Xatolik: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (chatModalOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatModalOpen]);

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (!scanResult) return <div className="flex justify-center items-center h-full text-slate-500">Natija topilmadi yoki sizga tegishli emas.</div>;

  const { risk_score, blind_spots, summary, is_scam, scam_details } = scanResult;
  const isHighRisk = risk_score >= 70;
  const isMediumRisk = risk_score >= 40 && risk_score < 70;
  
  const riskColorClass = isHighRisk ? "text-red-600" : isMediumRisk ? "text-orange-500" : "text-emerald-600";
  const riskBgClass = isHighRisk ? "bg-red-50 border-red-100" : isMediumRisk ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100";
  const riskGradientClass = isHighRisk ? "from-red-400 to-red-600" : isMediumRisk ? "from-orange-400 to-orange-500" : "from-emerald-400 to-emerald-600";
  const riskLabel = isHighRisk ? "Xavfli Hujjat" : isMediumRisk ? "O'rtacha Xavf" : "Xavfsiz Hujjat";

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative w-full h-full overflow-y-auto">
      <div className="bg-white/80 backdrop-blur-xl pt-6 pb-4 px-5 md:px-10 border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-sm sticky top-0">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <button onClick={() => router.push('/upload')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 bg-slate-100/50 hover:bg-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors font-medium text-sm">
            <ArrowRight className="w-5 h-5 rotate-180" />
            <span className="hidden md:block">Yopish</span>
          </button>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-800 absolute left-1/2 -translate-x-1/2">Tahlil Natijasi</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8 pb-8">
        <div className="max-w-5xl mx-auto space-y-5 md:space-y-6">
          <div className={`bg-white rounded-3xl border p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden ${riskBgClass}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none ${isHighRisk ? 'bg-red-100' : isMediumRisk ? 'bg-orange-100' : 'bg-emerald-100'}`}></div>
            
            <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${riskColorClass} drop-shadow-sm`} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${risk_score}, 100`} stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                <span className={`text-3xl md:text-4xl font-black ${riskColorClass} leading-none`}>{risk_score}</span>
                <span className="text-xs md:text-sm font-bold text-slate-400 mt-1">/ 100</span>
              </div>
            </div>
            
            <div className="flex-1 relative z-10 w-full text-center md:text-left">
              <h2 className={`text-3xl md:text-4xl font-black ${riskColorClass} mb-2 md:mb-3 tracking-tight`}>{riskLabel}</h2>
              <p className="text-sm md:text-base text-slate-600 font-medium mb-4 md:mb-6">
                {summary || "AI shartnomani tekshirib chiqdi. Quyidagi natijalarga e'tibor bering."}
              </p>
              
              {/* Detailed Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                {['To\'liqlik', 'Qonuniylik', 'Muvozanat', 'Aniqlik', 'Himoya'].map((cat, i) => (
                  <div key={i} className="bg-white/60 p-2 rounded-xl border border-white/40 shadow-sm text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{cat}</p>
                    <p className={`text-sm font-black ${riskColorClass}`}>{Math.round(risk_score / 5) * 5}%</p>
                  </div>
                ))}
              </div>

              <div className="h-2 md:h-3 w-full bg-slate-100 rounded-full overflow-hidden max-w-md mx-auto md:mx-0">
                <div className={`h-full bg-gradient-to-r ${riskGradientClass} rounded-full shadow-inner`} style={{ width: `${risk_score}%` }}></div>
              </div>
            </div>
          </div>

          {/* Unified Actions Toolbar: Counter-Offer, Chat & QR Certificate */}
          <div className="flex flex-col sm:flex-row gap-4 mb-2">
            <button 
              onClick={() => coDraft ? window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) : setCoModalOpen(true)}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-md group"
            >
              <PenTool className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>{coDraft ? "Tayyor xatni ko'rish" : "Qarshi Taklif Yozish (3 Coin)"}</span>
            </button>
            <button 
              onClick={() => setChatModalOpen(true)}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-sm group"
            >
              <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Hujjat bilan suhbat (Chat)</span>
            </button>
            <button 
              onClick={() => setQrModalOpen(true)}
              className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <QrCode className="w-5 h-5 text-slate-600" />
              <span>Tasdiqlash Sertifikati</span>
            </button>
          </div>

          {is_scam && (
            <div className="mb-6 w-full bg-red-600 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(220,38,38,0.3)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner backdrop-blur-sm border border-white/30">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2 tracking-tight">
                    DIQQAT! XAVFLI FIRIBGARLIK ANIQLANDI
                  </h3>
                  <p className="text-red-100 font-medium leading-relaxed">
                    Sizning shartnomangizda O'zbekistonda keng tarqalgan va juda ko'p odamlarga zarar keltirgan firibgarlik sxemasi alomatlari mavjud!
                  </p>
                </div>
              </div>
              <div className="relative z-10 mt-6 bg-black/20 p-5 rounded-2xl border border-white/10">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-300" /> Hayotiy Misol (Real voqea):
                </h4>
                <p className="text-red-50 text-sm font-medium leading-relaxed italic">
                  "{scam_details || "Ushbu bandlar orqali odamlar juda katta moliyaviy zarar ko'rishgan."}"
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
            {blind_spots && blind_spots.length > 0 ? (
              blind_spots.map((spot: any, idx: number) => {
                const theme = spot.color_theme || (spot.severity === 'high' ? 'red' : spot.severity === 'medium' ? 'orange' : spot.severity === 'info' ? 'blue' : 'green');
                
                let IconComponent = FileText;
                const t = spot.title.toLowerCase();
                if (t.includes('xavf') || t.includes('jarima') || t.includes('zarar') || t.includes('zid') || t.includes('asossiz')) IconComponent = AlertTriangle;
                else if (t.includes("to'lov") || t.includes('ish haqi') || t.includes('foyda') || t.includes('moliyaviy')) IconComponent = Coins;
                else if (t.includes('vaqti') || t.includes('muddat')) IconComponent = Clock;
                else if (t.includes('kafolat') || t.includes('xavfsizlik')) IconComponent = Shield;
                else if (t.includes('tavsiya') || t.includes('qilish kerak') || t.includes('muzokara') || t.includes('harakat')) IconComponent = ListTodo;
                else if (t.includes('majburiyat') || t.includes('vazifa') || t.includes('sifat') || t.includes('xulosa')) IconComponent = Award;
                else if (t.includes('sir') || t.includes('mulk') || t.includes('maxfiy')) IconComponent = Lock;

                return (
                  <AnalysisCard key={idx} title={spot.title} icon={IconComponent} colorTheme={theme} sectionRef={spot.section_ref} legalBasis={spot.legal_basis} recommendation={spot.recommendation} />
                )
              })
            ) : (
              <AnalysisCard title="Xavflar topilmadi" icon={ThumbsUp} colorTheme="green" recommendation="Shartnomada ochiq xavfli bandlar aniqlanmadi. Baribir mutaxassis bilan maslahatlashish tavsiya etiladi." />
            )}
          </div>

          {coDraft && (
            <div className="mt-8 bg-white rounded-3xl border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.06)] p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Qarshi Taklif Xati Tayyor</h3>
                  <p className="text-sm text-slate-500 font-medium">Ushbu matnni nusxalab ikkinchi tarafga yuborishingiz mumkin.</p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 font-serif text-slate-800 leading-relaxed whitespace-pre-wrap">
                {coDraft}
              </div>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => navigator.clipboard.writeText(coDraft).then(() => showToast("Matn muvaffaqiyatli nusxalandi! 📋"))}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <FileText className="w-5 h-5" /> Nusxa olish
                </button>
              </div>
            </div>
          )}

          <div className="pt-6 pb-8 border-t border-slate-200 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h4 className="font-bold text-slate-800 text-sm md:text-base">Tahlil foydali bo'ldimi?</h4>
                <p className="text-xs text-slate-500 mt-1">Sizning fikringiz sun'iy intellektni yaxshilashga yordam beradi.</p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                {feedbackGiven ? (
                  <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-emerald-100 w-full animate-scale-in">
                    <Sparkles className="w-4 h-4" /> Rahmat, qabul qilindi!
                  </div>
                ) : (
                  <>
                    <button onClick={() => { posthog?.capture('analysis_feedback', { type: 'thumbs_up' }); setFeedbackGiven(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl font-bold text-sm transition-colors border border-slate-200 hover:border-emerald-200">
                      <ThumbsUp className="w-4 h-4" /> Yaxshi
                    </button>
                    <button onClick={() => { posthog?.capture('analysis_feedback', { type: 'thumbs_down' }); setFeedbackGiven(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold text-sm transition-colors border border-slate-200 hover:border-red-200">
                      <ThumbsDown className="w-4 h-4" /> Yomon
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-center md:text-left text-slate-400 text-[10px] md:text-xs font-medium max-w-xl leading-relaxed">
                <strong className="text-slate-500">DIQQAT:</strong> Mohiyat AI – bu avtomatlashtirilgan sun'iy intellekt tizimi, professional yurist emas. Ushbu tahlil yuridik maslahat hisoblanmaydi va unda xatoliklar bo'lishi mumkin. Yakuniy qaror qabul qilishdan oldin har doim mutaxassis bilan maslahatlashing.
              </p>
              <button 
                onClick={() => router.push('/upload')}
                className="w-full md:w-auto md:px-8 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold md:text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0"
              >
                Yangi hujjat tekshirish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Counter-Offer Generation Modal */}
      <CounterOfferModal 
        isOpen={coModalOpen}
        setIsOpen={setCoModalOpen}
        blindSpots={blind_spots}
        coSelectedRisks={coSelectedRisks}
        setCoSelectedRisks={setCoSelectedRisks}
        coTone={coTone}
        setCoTone={setCoTone}
        coError={coError}
        coGenerating={coGenerating}
        handleGenerateCounterOffer={handleGenerateCounterOffer}
      />

      {/* Chat Modal */}
      <ChatModal 
        isOpen={chatModalOpen}
        setIsOpen={setChatModalOpen}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleSendMessage={handleSendMessage}
        chatLoading={chatLoading}
        chatEndRef={chatEndRef}
      />

      {/* QR Certificate Modal */}
      <CertificateModal 
        isOpen={qrModalOpen}
        setIsOpen={setQrModalOpen}
        sessionId={resolvedParams.id}
        sessionData={sessionData}
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          <span className="text-sm">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
