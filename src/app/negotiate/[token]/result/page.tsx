"use client";

import React, { useEffect, useState, use } from "react";
import {
  Scale, Loader2, AlertTriangle, CheckCircle2,
  XCircle, MessageSquare, Share2, Copy, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function NegotiateResultPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.rpc("get_negotiation_room", { p_token: token }).then(({ data, error: rpcErr }) => {
      if (rpcErr || !data?.length) {
        setError("Natija topilmadi.");
      } else {
        setRoom(data[0]);
      }
      setLoading(false);
    });
  }, [token]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const resultUrl = `${window.location.origin}/negotiate/${token}/result`;
    const msg = encodeURIComponent(`Shartnomamiz bo'yicha AI kompromiss natijasi tayyor:\n${resultUrl}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
    </div>
  );

  if (error || !room) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <AlertTriangle className="w-12 h-12 text-amber-500" />
      <h1 className="text-xl font-bold text-slate-800">{error || "Natija topilmadi"}</h1>
      <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold">Bosh sahifa</Link>
    </div>
  );

  if (room.status !== "completed") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-slate-600 font-medium">AI kompromiss tayyorlanmoqda...</p>
    </div>
  );

  const compromise = room.ai_compromise;
  const clauses: any[] = compromise?.clauses || [];
  const balance: number = room.compromise_balance ?? 50;
  const guestBalance = 100 - balance;

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg,#0a1628,#0f1f38)" }} className="py-6 px-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(37,99,235,0.3)" }}>
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm">Mohiyat AI — Hakam Qarori</p>
              <p className="text-xs font-medium" style={{ color: "rgba(148,163,184,0.8)" }}>{room.short_title || "Shartnoma muzokara"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleCopy(`${window.location.origin}/negotiate/${token}/result`)}
                    className="p-2 rounded-xl text-white transition" style={{ background: "rgba(255,255,255,0.1)" }}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={handleWhatsApp} className="p-2 rounded-xl text-white transition" style={{ background: "rgba(37,211,102,0.2)" }}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Balance card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h1 className="text-xl font-extrabold text-slate-800 mb-1">🤖 AI Hakam Qarori</h1>
          <p className="text-sm text-slate-500 font-medium mb-6">{compromise?.summary || "Adolatli kompromiss topildi."}</p>

          <div className="mb-2 flex items-center justify-between text-xs font-bold">
            <span className="text-indigo-700">1-tomon: {Math.round(balance)}%</span>
            <span className="text-emerald-700">2-tomon: {Math.round(guestBalance)}%</span>
          </div>
          <div className="h-4 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${balance}%`, background: "linear-gradient(90deg,#4f46e5,#2563eb)" }} />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-medium">
            <span>1-tomon foydasi</span>
            <span className="font-bold text-slate-600">Adolatlilik balanseri</span>
            <span>2-tomon foydasi</span>
          </div>
        </div>

        {/* Per-clause results */}
        <div className="space-y-4">
          {clauses.map((clause: any, i: number) => {
            const decision = clause.guest_response;
            return (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Clause header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
                  <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm font-extrabold text-slate-800">{clause.risk_title}</p>
                </div>

                {/* Guest response badge */}
                <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3">
                  {decision === "accept" && <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs font-bold text-emerald-700">2-tomon qabul qildi</span></>}
                  {decision === "reject" && <><XCircle className="w-4 h-4 text-red-500" /><span className="text-xs font-bold text-red-600">2-tomon rad etdi</span></>}
                  {decision === "counter" && <><MessageSquare className="w-4 h-4 text-indigo-500" /><span className="text-xs font-bold text-indigo-600">2-tomon qarshi taklif berdi</span></>}
                </div>

                {/* AI compromise */}
                <div className="px-6 py-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">🤖 AI Kompromiss</p>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">{clause.compromise}</p>
                  {clause.legal_basis && (
                    <p className="text-xs text-indigo-600 font-bold mt-3 flex items-center gap-1.5">
                      <Scale className="w-3 h-3" />
                      {clause.legal_basis}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Share */}
        <div className="grid grid-cols-2 gap-3 pb-10">
          <button onClick={() => handleCopy(`${window.location.origin}/negotiate/${token}/result`)}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition"
                  style={{ background: "#1e293b", color: "#fff" }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Nusxalandi!" : "Havolani nusxalash"}
          </button>
          <button onClick={handleWhatsApp}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white transition"
                  style={{ background: "#25D366" }}>
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
