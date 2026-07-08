"use client";

import React, { useState } from "react";
import {
  X, Users, CheckCircle2, Loader2, AlertTriangle, Coins,
  Copy, Check, Share2, ChevronRight, PenLine, ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Demand {
  risk_title: string;
  current_text: string;
  proposed_change: string;
}

interface NegotiateModalProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  sessionId: string;
  blindSpots: any[];
}

type Step = "select" | "propose" | "confirm" | "done";

export function NegotiateModal({ isOpen, setIsOpen, sessionId, blindSpots }: NegotiateModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [demands, setDemands] = useState<Record<string, Demand>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestUrl, setGuestUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const toggleRisk = (title: string) => {
    setSelectedRisks(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
    if (!demands[title]) {
      const spot = blindSpots.find(s => s.title === title);
      setDemands(prev => ({
        ...prev,
        [title]: {
          risk_title: title,
          current_text: spot?.section_ref || "",
          proposed_change: spot?.recommendation || "",
        },
      }));
    }
  };

  const updateDemand = (title: string, field: keyof Demand, value: string) => {
    setDemands(prev => ({ ...prev, [title]: { ...prev[title], [field]: value } }));
  };

  const handleInvite = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const demandsArray = selectedRisks.map(title => demands[title]).filter(Boolean);

      const res = await fetch("/api/negotiate/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ session_id: sessionId, demands: demandsArray }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");
      setGuestUrl(data.guest_url);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (guestUrl) {
      navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    if (guestUrl) {
      const msg = encodeURIComponent(
        `Salom! Shartnomamiz bo'yicha muzokara uchun ushbu havola orqali kirishingizni so'rayman:\n${guestUrl}`
      );
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    }
  };

  const canProceedFromSelect = selectedRisks.length > 0;
  const canProceedFromPropose = selectedRisks.every(t => demands[t]?.proposed_change?.trim());

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:rounded-3xl sm:max-w-xl max-h-[95dvh] flex flex-col shadow-2xl sm:border border-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Muzokara Boshlash</h2>
              <p className="text-xs text-slate-500 font-medium">AI hakam orqali kelishuv</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== "done" && (
          <div className="px-6 pt-4 flex items-center gap-2 shrink-0">
            {(["select", "propose", "confirm"] as const).map((s, i) => {
              const current = ["select", "propose", "confirm"].indexOf(step);
              const done = i < current;
              const active = i === current;
              return (
                <React.Fragment key={s}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done ? "bg-indigo-600 text-white" : active ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400" : "bg-slate-100 text-slate-400"
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {i < 2 && <div className={`flex-1 h-0.5 ${i < current ? "bg-indigo-600" : "bg-slate-200"}`} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

          {/* STEP 1: Select risks */}
          {step === "select" && (
            <>
              <p className="text-sm text-slate-600 font-medium">Muzokara qilmoqchi bo'lgan xavflarni tanlang:</p>
              <div className="space-y-2">
                {blindSpots.length === 0 && (
                  <p className="text-slate-400 text-sm">Xavflar topilmadi.</p>
                )}
                {blindSpots.map((spot, i) => {
                  const selected = selectedRisks.includes(spot.title);
                  return (
                    <div key={i} onClick={() => toggleRisk(spot.title)}
                         className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${selected ? "bg-indigo-50 border-indigo-300" : "bg-slate-50 border-slate-200 hover:border-indigo-200"}`}>
                      <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"}`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${selected ? "text-indigo-900" : "text-slate-700"}`}>{spot.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{spot.recommendation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* STEP 2: Propose changes */}
          {step === "propose" && (
            <>
              <p className="text-sm text-slate-600 font-medium">Har bir band uchun o'z talabingizni kiriting:</p>
              <div className="space-y-5">
                {selectedRisks.map((title, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                    <p className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                      {title}
                    </p>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Hozirgi holat (ixtiyoriy)</label>
                      <input
                        type="text"
                        value={demands[title]?.current_text || ""}
                        onChange={e => updateDemand(title, "current_text", e.target.value)}
                        placeholder="Masalan: '5-band: 10% jarima'"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Sizning talabingiz *</label>
                      <textarea
                        rows={2}
                        value={demands[title]?.proposed_change || ""}
                        onChange={e => updateDemand(title, "proposed_change", e.target.value)}
                        placeholder="Masalan: 'Jarima 3% dan oshmasligi kerak'"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 transition resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 3: Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
                <h3 className="font-extrabold text-indigo-900 mb-3 flex items-center gap-2"><PenLine className="w-4 h-4" /> Muzokara xulosa</h3>
                <div className="space-y-3">
                  {selectedRisks.map((title, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-bold text-slate-700">{title}</p>
                      <p className="text-slate-500 mt-0.5">→ {demands[title]?.proposed_change}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <Coins className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Narxi: 5 Coin</p>
                  <p className="text-xs text-amber-700">Xona yaratish va havola olish uchun</p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Done — share link */}
          {step === "done" && guestUrl && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-1">Xona tayyor!</h3>
                <p className="text-sm text-slate-500">Ushbu havolani qarshi tomonga yuboring:</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <p className="flex-1 text-xs text-slate-700 font-mono break-all">{guestUrl}</p>
                <button onClick={handleCopy}
                        className={`shrink-0 p-2 rounded-xl transition-colors ${copied ? "bg-emerald-100 text-emerald-600" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleCopy}
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Nusxalandi!" : "Nusxa olish"}
                </button>
                <button onClick={handleWhatsApp}
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition"
                        style={{ background: "#25D366" }}>
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step !== "done" && (
          <div className="p-5 sm:p-6 border-t border-slate-100 shrink-0 flex gap-3">
            {step !== "select" && (
              <button onClick={() => setStep(step === "propose" ? "select" : "propose")}
                      className="px-5 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-sm">
                Orqaga
              </button>
            )}
            {step === "select" && (
              <button onClick={() => setStep("propose")} disabled={!canProceedFromSelect}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition text-sm">
                Davom etish <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === "propose" && (
              <button onClick={() => setStep("confirm")} disabled={!canProceedFromPropose}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition text-sm">
                Ko'rib chiqish <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === "confirm" && (
              <button onClick={handleInvite} disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Yaratilmoqda...</> : <>Xona yaratish (5 Coin) <ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
