"use client";

import React, { useEffect, useState, use } from "react";
import {
  Shield, Loader2, AlertTriangle, Check, X, MessageSquare,
  ChevronRight, CheckCircle2, Clock, Scale,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ──────────────────────────────────────────────
// Inline auth gate (same pattern as SharedReportView)
// ──────────────────────────────────────────────
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Phone } from "lucide-react";

function AuthGate({ onSuccess }: { onSuccess: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, phone } },
        });
        if (error) throw error;
        if (!data.session) { setSuccessMsg("Pochtangizni tasdiqlang va qaytib keling."); return; }
        onSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      const m = err.message || "";
      setErrorMsg(m === "Invalid login credentials" ? "Email yoki parol noto'g'ri" : m === "User already registered" ? "Bu email ro'yxatdan o'tgan. Kiring!" : m);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
         style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f1f38 50%, #162a4a 100%)" }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
           style={{ background: "radial-gradient(circle, #2563eb, transparent)" }} />
      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg,#2563eb,#1e3a5f)", boxShadow: "0 0 40px rgba(37,99,235,0.4)" }}>
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">AI Muzokara</h1>
          <p className="text-sm mt-2 font-medium" style={{ color: "rgba(148,163,184,0.9)" }}>
            Muzokara talablarini ko'rish va javob berish uchun kiring
          </p>
        </div>
        <div className="rounded-3xl p-8 shadow-2xl border"
             style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
          <div className="flex mb-6 p-1 rounded-2xl" style={{ background: "rgba(0,0,0,0.3)" }}>
            {["Kirish", "Ro'yxat"].map((label, i) => {
              const active = isSignUp === Boolean(i);
              return (
                <button key={i} onClick={() => { setIsSignUp(Boolean(i)); setErrorMsg(null); }}
                        className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                        style={{ background: active ? "linear-gradient(135deg,#2563eb,#1e3a5f)" : "transparent", color: active ? "#fff" : "rgba(148,163,184,0.8)" }}>
                  {label}
                </button>
              );
            })}
          </div>
          <button onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm mb-4 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google orqali kirish
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>yoki</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>
          {errorMsg && <div className="mb-4 p-3.5 rounded-xl flex items-start gap-2.5 text-sm font-medium" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3.5 rounded-xl flex items-start gap-2.5 text-sm font-medium" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7" }}><Sparkles className="w-4 h-4 shrink-0 mt-0.5" />{successMsg}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isSignUp && (
              <>
                <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} /><input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ism va familiyangiz" className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} /></div>
                <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} /><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon (ixtiyoriy)" className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} /></div>
              </>
            )}
            <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Elektron pochta" className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} /></div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} />
              <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Parol" className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm font-medium focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.6)" }}>{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <button type="submit" disabled={loading} className="mt-2 w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-60" style={{ background: "linear-gradient(135deg,#2563eb,#1e3a5f)", color: "#fff", boxShadow: "0 4px 20px rgba(37,99,235,0.5)" }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{isSignUp ? "Ro'yxatdan o'tish" : "Muzokara xonasiga kirish"}</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main guest negotiation page
// ──────────────────────────────────────────────
type Decision = "accept" | "reject" | "counter";

interface Response {
  demand_index: number;
  decision: Decision;
  counter_text?: string;
}

export default function NegotiateGuestPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const router = useRouter();

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      if (session?.user) setCurrentUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      if (session?.user) setCurrentUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch room
  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    supabase.rpc("get_negotiation_room", { p_token: token }).then(({ data, error: rpcErr }) => {
      if (rpcErr || !data?.length) {
        setError("Muzokara xonasi topilmadi yoki havola yaroqsiz.");
      } else {
        const r = data[0];
        setRoom(r);
        // Init responses
        const demands: any[] = r.demands || [];
        const existingResp = r.responses || [];
        setResponses(demands.map((_: any, i: number) => {
          const ex = existingResp.find((er: any) => er.demand_index === i);
          return ex ? ex : { demand_index: i, decision: "accept" as Decision };
        }));
        // If already responded, redirect to waiting
        if (r.status === "completed") router.push(`/negotiate/${token}/result`);
        if (r.status !== "pending" && r.status !== "rejected") setSubmitted(true);
      }
      setLoading(false);
    });
  }, [authed, token, router]);

  // Realtime — watch for completion
  useEffect(() => {
    if (!room?.id) return;
    const channel = supabase
      .channel("room-" + room.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "negotiation_rooms", filter: `id=eq.${room.id}` },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === "completed") router.push(`/negotiate/${token}/result`);
          if (newStatus) setRoom((prev: any) => ({ ...prev, status: newStatus }));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, token, router]);

  const setDecision = (demandIndex: number, decision: Decision) => {
    setResponses(prev => prev.map(r => r.demand_index === demandIndex ? { ...r, decision } : r));
  };
  const setCounterText = (demandIndex: number, text: string) => {
    setResponses(prev => prev.map(r => r.demand_index === demandIndex ? { ...r, counter_text: text } : r));
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    const invalid = responses.find(r => r.decision === "counter" && !r.counter_text?.trim());
    if (invalid) { setError("Qarshi taklif uchun matn kiriting."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/negotiate/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          responses,
          guest_user_id: currentUser.id,
          guest_name: guestName || currentUser.user_metadata?.full_name || "Mehmon",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authed === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0a1628,#0f1f38)" }}>
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  if (!authed) return <AuthGate onSuccess={() => setAuthed(true)} />;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;

  if (error && !room) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <AlertTriangle className="w-12 h-12 text-amber-500" />
      <h1 className="text-xl font-bold text-slate-800 text-center">{error}</h1>
      <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition">Bosh sahifa</Link>
    </div>
  );

  const demands: any[] = room?.demands || [];

  // Submitted / awaiting state
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#f8fafc" }}>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-3">Javobingiz yuborildi!</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            {room.status === "ai_drafting"
              ? "AI kompromiss tayyorlamoqda... Sahifa avtomatik yangilanadi."
              : "Tasdiqlash kutilmoqda. Initiator tasdiqlagan zahoti AI kompromiss yaratadi."}
          </p>
          {room.status === "ai_drafting" ? (
            <div className="mt-6 flex items-center justify-center gap-2 text-blue-600 font-medium">
              <Loader2 className="w-5 h-5 animate-spin" /> AI ishlayapti...
            </div>
          ) : (
            <div className="mt-8">
              <Link href="/" className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors inline-flex items-center gap-2">
                Bosh sahifaga qaytish
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg,#0a1628,#0f1f38)" }} className="py-5 px-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(37,99,235,0.3)" }}>
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-extrabold text-sm">Mohiyat AI — Muzokara</p>
            <p className="text-xs font-medium" style={{ color: "rgba(148,163,184,0.8)" }}>{room?.short_title || "Shartnoma muzokara"}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Context card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h1 className="text-lg font-extrabold text-slate-800 mb-1">Muzokara Talablari</h1>
          <p className="text-sm text-slate-500 font-medium">
            {room?.file_name || "Shartnoma"} bo'yicha {demands.length} ta band muhokama qilinmoqda.
            Har birini ko'rib chiqing va qaror qiling.
          </p>
        </div>

        {/* Your name (if not set) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ismingiz (ixtiyoriy)</label>
          <input
            type="text"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            placeholder={currentUser?.user_metadata?.full_name || "Ismingizni kiriting"}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-400 transition"
          />
        </div>

        {/* Demand cards */}
        {demands.map((demand: any, i: number) => {
          const resp = responses.find(r => r.demand_index === i);
          return (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Demand header */}
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-start gap-3">
                <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm font-extrabold text-indigo-900">{demand.risk_title}</p>
                  {demand.current_text && <p className="text-xs text-indigo-700 mt-1 font-medium">📋 Hozirgi: {demand.current_text}</p>}
                </div>
              </div>
              {/* Proposed change */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">1-tomon talabi</p>
                <p className="text-sm font-medium text-slate-700">{demand.proposed_change}</p>
              </div>
              
              {/* Discussion History */}
              {demand.discussion && demand.discussion.length > 0 && (
                <div className="px-6 py-4 bg-slate-50/50 space-y-3 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Oldingi yozishmalar</p>
                  {demand.discussion.map((msg: any, idx: number) => (
                    <div key={idx} className={`flex flex-col ${msg.from === 'guest' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${msg.from === 'guest' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                        <span className="text-[10px] font-bold block mb-1 opacity-70">{msg.from === 'guest' ? 'Siz' : 'Tashabbuskor (1-tomon)'}</span>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Response options */}
              <div className="px-6 py-5 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sizning qaroringiz</p>
                {(["accept", "reject", "counter"] as const).map(option => {
                  const selected = resp?.decision === option;
                  const labels: Record<string, string> = { accept: "✅ Qabul qilaman", reject: "❌ Rad etaman", counter: "✏️ Boshqacha taklif" };
                  const colors: Record<string, string> = { accept: "border-emerald-400 bg-emerald-50", reject: "border-red-400 bg-red-50", counter: "border-indigo-400 bg-indigo-50" };
                  return (
                    <div key={option}>
                      <div onClick={() => setDecision(i, option)}
                           className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${selected ? colors[option] : "border-slate-200 bg-white hover:border-slate-300"}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? (option === "accept" ? "bg-emerald-600 border-emerald-600" : option === "reject" ? "bg-red-600 border-red-600" : "bg-indigo-600 border-indigo-600") : "border-slate-300 bg-white"}`}>
                          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-bold ${selected ? (option === "accept" ? "text-emerald-800" : option === "reject" ? "text-red-800" : "text-indigo-800") : "text-slate-700"}`}>
                          {labels[option]}
                        </span>
                      </div>
                      {selected && option === "counter" && (
                        <textarea rows={2} value={resp?.counter_text || ""} onChange={e => setCounterText(i, e.target.value)}
                                  placeholder="Sizning taklifingizni yozing..."
                                  className="w-full mt-2 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-400 transition resize-none" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting || demands.length === 0}
                className="w-full py-5 rounded-3xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                style={{ background: "linear-gradient(135deg,#4f46e5,#2563eb)", color: "#fff", boxShadow: "0 8px 30px rgba(79,70,229,0.4)" }}>
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Yuborilmoqda...</> : <><CheckCircle2 className="w-5 h-5" /> Javoblarni yuborish</>}
        </button>

        <p className="text-center text-xs text-slate-400 font-medium pb-8">
          Javob bergandan so'ng initiator tasdiqlaydi, keyin AI kompromiss yaratadi
        </p>
      </div>
    </div>
  );
}
