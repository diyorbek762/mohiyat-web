"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SharedReport } from "@/lib/supabase";
import { severityColor, severityLabel, riskScoreColor } from "@/lib/utils";
import Link from "next/link";

interface SharedReportViewProps {
  token: string;
}

export function SharedReportView({ token }: SharedReportViewProps) {
  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [token]);

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
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: riskScoreColor(spot.severity === "high" ? 80 : spot.severity === "medium" ? 50 : 20) }} />
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
