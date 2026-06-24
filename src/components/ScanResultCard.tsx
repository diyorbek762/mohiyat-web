"use client";

import { AlertTriangle, Lock, Eye, CreditCard, Sparkles } from "lucide-react";
import type { ScanResult } from "@/lib/supabase";
import { severityColor, severityLabel, riskScoreColor } from "@/lib/utils";

interface ScanResultCardProps {
  result: ScanResult;
  onUnlock?: () => void;
}

export function ScanResultCard({ result, onUnlock }: ScanResultCardProps) {
  const { blind_spots, risk_score, summary, processing_ms } = result;
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (risk_score / 100) * circumference;
  const scoreColor = riskScoreColor(risk_score);

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div className="card-glow p-7 sm:p-9">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[var(--gold-500)]" />
              <h3 className="text-xl font-bold text-[var(--foreground)]">Tahlil natijasi</h3>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] font-medium">
              {processing_ms}ms da tahlil qilindi · AI Gemini Flash
            </p>
          </div>
          {/* Risk ring */}
          <div className="risk-ring" style={{ width: 90, height: 90 }}>
            <svg width="90" height="90" viewBox="0 0 120 120">
              <circle className="track" cx="60" cy="60" r="50" />
              <circle className="progress" cx="60" cy="60" r="50"
                stroke={scoreColor} strokeDasharray={circumference} strokeDashoffset={offset} />
            </svg>
            <div className="value">
              <span className="text-2xl font-extrabold" style={{ color: scoreColor }}>{risk_score}</span>
              <span className="text-[9px] text-[var(--foreground-muted)] font-semibold uppercase tracking-wider">xavf balli</span>
            </div>
          </div>
        </div>

        {summary && (
          <p className="text-sm text-[var(--foreground-muted)] mb-7 leading-relaxed p-4 rounded-xl" style={{ background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.08)" }}>
            {summary}
          </p>
        )}

        {/* Blind Spots */}
        <div className="space-y-3 mb-8">
          <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--navy-500)]" />
            Aniqlangan xavflar
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)" }}>
              {blind_spots.length}
            </span>
          </h4>
          {blind_spots.map((spot, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl transition-all hover:shadow-md"
                 style={{ background: "var(--background-subtle)", border: "1px solid var(--border-subtle)" }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: riskScoreColor(spot.severity === "high" ? 80 : spot.severity === "medium" ? 50 : 20) }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{spot.title}</span>
                  <span className={`badge ${severityColor(spot.severity)}`}>{severityLabel(spot.severity)}</span>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">{spot.section_ref}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Locked */}
        <div className="relative rounded-xl overflow-hidden mb-8">
          <div className="blur-lock p-6" style={{ background: "var(--background-subtle)" }}>
            <p className="text-sm text-[var(--foreground)]">Batafsil yuridik tahlil va tavsiyalar...</p>
            <p className="text-sm text-[var(--foreground)] mt-2">Har bir xavf uchun qonuniy asos va amaliy qadamlar...</p>
            <p className="text-sm text-[var(--foreground)] mt-2">Shartnomani qanday o&apos;zgartirish kerak...</p>
          </div>
          <div className="blur-lock-overlay">
            <div className="w-12 h-12 rounded-full flex items-center justify-center animate-glow-pulse"
                 style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
              <Lock className="w-5 h-5 text-[var(--navy-500)]" />
            </div>
            <span className="text-sm font-bold text-[var(--foreground)]">To&apos;liq hisobot qulflangan</span>
          </div>
        </div>

        {/* CTA */}
        <button onClick={onUnlock} className="btn btn-primary btn-lg w-full group" id="unlock-report-btn"
                style={{ background: "linear-gradient(135deg, var(--navy-500), #1d4ed8)", boxShadow: "0 6px 24px rgba(37,99,235,0.35)" }}>
          <CreditCard className="w-5 h-5" />
          To&apos;liq hisobotni ochish — 5,000 so&apos;m
          <Sparkles className="w-4 h-4 text-[var(--gold-400)] transition-transform group-hover:rotate-12" />
        </button>
        <p className="text-center text-xs text-[var(--foreground-muted)] mt-3 font-medium">
          Payme yoki Click orqali xavfsiz to&apos;lov
        </p>
      </div>
    </div>
  );
}
