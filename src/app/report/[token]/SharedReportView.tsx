"use client";

import { useEffect, useState } from "react";
import {
  Shield, AlertTriangle, FileText, Loader2,
  Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SharedReport } from "@/lib/supabase";
import { severityColor, severityLabel, riskScoreColor } from "@/lib/utils";
import Link from "next/link";

interface SharedReportViewProps {
  token: string;
}

/* ─────────────────────────────────────────────
   Inline auth gate — shown only once per device
───────────────────────────────────────────── */
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
          email,
          password,
          options: { data: { full_name: fullName, phone } },
        });
        if (error) throw error;
        if (!data.session) {
          setSuccessMsg("Pochtangizga tasdiqlash xati yuborildi. Tasdiqlang va qaytib keling.");
          return;
        }
        onSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      const msg = err.message || "";
      setErrorMsg(
        msg === "Invalid login credentials" ? "Email yoki parol noto'g'ri" :
        msg === "User already registered"   ? "Bu email ro'yxatdan o'tgan. Kiring!" :
        msg === "Email not confirmed"       ? "Avval pochtangizni tasdiqlang." :
        msg
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
         style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f1f38 50%, #162a4a 100%)" }}>

      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
           style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
           style={{ background: "radial-gradient(circle, #d4a853 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-2xl"
               style={{ background: "linear-gradient(135deg, #2563eb, #1e3a5f)", boxShadow: "0 0 40px rgba(37,99,235,0.4)" }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Mohiyat AI</h1>
          <p className="text-sm mt-2 font-medium" style={{ color: "rgba(148,163,184,0.9)" }}>
            Hisobotni ko'rish uchun bir marta kiring — keyin hech qachon qaytadan so'ralmaydi
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 shadow-2xl border"
             style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

          {/* Toggle tabs */}
          <div className="flex mb-6 p-1 rounded-2xl" style={{ background: "rgba(0,0,0,0.3)" }}>
            {["Kirish", "Ro'yxat"].map((label, i) => {
              const active = isSignUp === Boolean(i);
              return (
                <button key={i} onClick={() => { setIsSignUp(Boolean(i)); setErrorMsg(null); setSuccessMsg(null); }}
                        className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200"
                        style={{
                          background: active ? "linear-gradient(135deg, #2563eb, #1e3a5f)" : "transparent",
                          color: active ? "#fff" : "rgba(148,163,184,0.8)",
                          boxShadow: active ? "0 4px 14px rgba(37,99,235,0.4)" : "none",
                        }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Google */}
          <button onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm mb-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google orqali kirish
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>yoki</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl flex items-start gap-2.5 text-sm font-medium"
                 style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl flex items-start gap-2.5 text-sm font-medium"
                 style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7" }}>
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isSignUp && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} />
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                         placeholder="Ism va familiyangiz"
                         className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium transition-all focus:outline-none"
                         style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                         placeholder="Telefon (ixtiyoriy)"
                         className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium transition-all focus:outline-none"
                         style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                     placeholder="Elektron pochta"
                     className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium transition-all focus:outline-none"
                     style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} />
              <input type={showPass ? "text" : "password"} required value={password}
                     onChange={e => setPassword(e.target.value)}
                     placeholder="Parol"
                     className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm font-medium transition-all focus:outline-none"
                     style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 transition-opacity hover:opacity-80"
                      style={{ color: "rgba(148,163,184,0.6)" }}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button type="submit" disabled={loading}
                    className="mt-2 w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #2563eb, #1e3a5f)", color: "#fff", boxShadow: "0 4px 20px rgba(37,99,235,0.5)" }}>
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><span>{isSignUp ? "Ro'yxatdan o'tish" : "Hisobotni ko'rish"}</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 font-medium" style={{ color: "rgba(148,163,184,0.5)" }}>
          Kirgandan so'ng bu qurilmada qaytadan so'ralmaysiz
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main shared report view
───────────────────────────────────────────── */
export function SharedReportView({ token }: SharedReportViewProps) {
  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // null = still checking, false = not authed, true = authed
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Check existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    // Also listen for auth state changes (e.g. after Google redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch report once authed
  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    async function fetchReport() {
      try {
        const { data, error: rpcError } = await supabase.rpc("get_shared_report", { p_share_token: token });
        if (rpcError) throw rpcError;
        if (!data || data.length === 0) {
          setError("Hisobot topilmadi yoki muddati tugagan");
          return;
        }
        setReport(data[0]);
      } catch {
        setError("Hisobotni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [authed, token]);

  // Still checking session
  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a1628, #0f1f38)" }}>
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Not authed — show gate
  if (!authed) {
    return <AuthGate onSuccess={() => setAuthed(true)} />;
  }

  // Loading report
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--navy-500)] animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <AlertTriangle className="w-12 h-12 text-[var(--warning)]" />
        <h1 className="text-xl font-semibold text-[var(--foreground)]">{error || "Hisobot topilmadi"}</h1>
        <Link href="/" className="btn btn-primary">Bosh sahifaga qaytish</Link>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (report.risk_score / 100) * circumference;
  const scoreColor = riskScoreColor(report.risk_score);

  return (
    <div className="min-h-screen" style={{ background: "var(--background-subtle)" }}>
      {/* Header */}
      <header className="hero-gradient py-6">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <span className="text-base font-semibold text-white">Mohiyat<span className="text-[var(--navy-300)] ml-0.5 font-normal">AI</span></span>
          </Link>
          <span className="text-xs text-[var(--navy-300)]">Ulashilgan hisobot</span>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-6 sm:p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-[var(--navy-500)]" />
                <h1 className="text-lg font-semibold text-[var(--foreground)]">{report.file_name || "Shartnoma"}</h1>
              </div>
              <p className="text-xs text-[var(--foreground-muted)]">
                Sana: {new Date(report.created_at).toLocaleDateString("uz-UZ")}
                {report.detected_domain && ` • Turi: ${report.detected_domain}`}
              </p>
            </div>
            <div className="risk-ring" style={{ width: 80, height: 80 }}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle className="track" cx="60" cy="60" r="50" />
                <circle className="progress" cx="60" cy="60" r="50" stroke={scoreColor} strokeDasharray={circumference} strokeDashoffset={offset} />
              </svg>
              <div className="value">
                <span className="text-xl font-bold" style={{ color: scoreColor }}>{report.risk_score}</span>
                <span className="text-[10px] text-[var(--foreground-muted)]">xavf</span>
              </div>
            </div>
          </div>

          {/* Blind spots */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Aniqlangan xavflar</h3>
            {report.blind_spots.map((spot, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--background-subtle)" }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0"
                               style={{ color: riskScoreColor(spot.severity === "high" ? 80 : spot.severity === "medium" ? 50 : 20) }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--foreground)]">{spot.title}</span>
                    <span className={`badge ${severityColor(spot.severity)}`}>{severityLabel(spot.severity)}</span>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{spot.section_ref}</p>
                  {spot.recommendation && <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">{spot.recommendation}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Full report */}
          {report.full_report && (
            <>
              <div className="section-divider my-6" />
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Batafsil tahlil</h3>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed mb-4">{report.full_report.overall_summary}</p>
              {report.full_report.recommendations && (
                <div className="p-4 rounded-xl" style={{ background: "var(--info-light)" }}>
                  <h4 className="text-xs font-semibold text-[var(--info)] mb-2">Tavsiyalar</h4>
                  <ul className="space-y-1">
                    {report.full_report.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-[var(--foreground-muted)] flex items-start gap-2">
                        <span className="text-[var(--info)]">•</span>{rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-[var(--foreground-muted)] mb-3">O&apos;z shartnomangizni ham tekshiring</p>
          <Link href="/#upload" className="btn btn-primary">Shartnoma yuklash</Link>
        </div>
      </div>
    </div>
  );
}
