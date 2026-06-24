"use client";

import { Shield, FileSearch, Lock, Zap, ArrowRight, ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="hero-gradient relative min-h-screen flex items-center pt-20 pb-12">
      {/* Animated orbs */}
      <div className="orb orb-blue w-[500px] h-[500px] -top-40 -left-40 animate-float-slow" />
      <div className="orb orb-gold w-[400px] h-[400px] top-1/3 -right-32 animate-float-slow" style={{ animationDelay: "2s" }} />
      <div className="orb orb-blue w-[300px] h-[300px] -bottom-20 left-1/3 animate-float-slow" style={{ animationDelay: "4s" }} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            {/* Trust chip */}
            <div className="animate-fade-in-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8"
                 style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(212,168,83,0.1))", border: "1px solid rgba(37,99,235,0.2)" }}>
              <Shield className="w-4 h-4 text-[var(--gold-400)]" />
              <span className="text-xs font-semibold text-[var(--navy-200)] tracking-wide uppercase">
                O&apos;zbekiston Fuqarolik Kodeksiga asoslangan
              </span>
            </div>

            <h1 className="animate-slide-up text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-8 tracking-tight">
              <span className="text-white">Shartnomangiz</span>
              <br />
              <span className="gradient-text">xavfsizligini</span>
              <br />
              <span className="text-white">tekshiring</span>
            </h1>

            <p className="animate-fade-in-up stagger-2 text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-lg">
              Sun&apos;iy intellekt yordamida yashirin jarimalar va xavfli bandlarni{" "}
              <span className="text-white font-semibold">30 soniyada</span> aniqlang.
            </p>

            <div className="animate-fade-in-up stagger-3 flex flex-wrap items-center gap-4 mb-14">
              <a href="#upload" className="btn btn-hero group" id="hero-cta-upload">
                <FileSearch className="w-5 h-5" />
                Shartnomani yuklash
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#how-it-works" className="btn btn-outline-light" id="hero-cta-learn">
                Qanday ishlaydi?
                <ChevronDown className="w-4 h-4" />
              </a>
            </div>

            {/* Stats */}
            <div className="animate-fade-in-up stagger-4 flex items-center gap-10">
              {[
                { value: "30s", label: "Tahlil vaqti" },
                { value: "100%", label: "Maxfiylik" },
                { value: "Bepul", label: "Tekshirish" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Premium mock card */}
          <div className="hidden lg:block animate-slide-up stagger-3">
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute inset-0 rounded-3xl" style={{ background: "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.15) 0%, transparent 70%)", transform: "scale(1.1)" }} />

              {/* Main card */}
              <div className="relative glass-dark rounded-2xl p-7 border border-[rgba(37,99,235,0.2)] animate-glow-pulse" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
                {/* Top bar */}
                <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                    <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono ml-2">mohiyat_tahlil.json</span>
                  <div className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold text-[var(--gold-400)]" style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.2)" }}>
                    LIVE
                  </div>
                </div>

                {/* Risk items */}
                <div className="space-y-3">
                  {[
                    { text: "5% penya bandi — 4-bo'lim", severity: "high", sev: "YUQORI" },
                    { text: "Bir tomonlama bekor qilish huquqi", severity: "medium", sev: "O'RTA" },
                    { text: "Muddat shartlari normada", severity: "low", sev: "PAST" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl transition-all hover:scale-[1.02]"
                         style={{
                           background: item.severity === "high" ? "rgba(239,68,68,0.08)" : item.severity === "medium" ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)",
                           border: `1px solid ${item.severity === "high" ? "rgba(239,68,68,0.15)" : item.severity === "medium" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)"}`,
                           animationDelay: `${i * 0.15}s`,
                         }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.severity === "high" ? "#ef4444" : item.severity === "medium" ? "#f59e0b" : "#10b981", boxShadow: `0 0 8px ${item.severity === "high" ? "rgba(239,68,68,0.5)" : item.severity === "medium" ? "rgba(245,158,11,0.5)" : "rgba(16,185,129,0.5)"}` }} />
                        <span className="text-sm text-white font-medium">{item.text}</span>
                      </div>
                      <span className={`badge badge-${item.severity}`}>{item.sev}</span>
                    </div>
                  ))}
                </div>

                {/* Locked section */}
                <div className="mt-5 relative rounded-xl overflow-hidden">
                  <div className="blur-lock p-4" style={{ background: "rgba(37,99,235,0.05)" }}>
                    <p className="text-sm text-slate-300">Batafsil tahlil va tavsiyalar yashirilgan...</p>
                    <p className="text-sm text-slate-300 mt-1">Qonuniy asoslar va amaliy qadamlar...</p>
                  </div>
                  <div className="blur-lock-overlay" style={{ background: "linear-gradient(135deg, rgba(10,22,40,0.85), rgba(15,31,56,0.9))" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center animate-glow-pulse" style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)" }}>
                      <Lock className="w-4 h-4 text-[var(--navy-300)]" />
                    </div>
                    <span className="text-xs text-[var(--navy-200)] font-semibold tracking-wide uppercase">To&apos;liq hisobot</span>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -left-8 top-10 glass-dark rounded-2xl p-3.5 animate-float border border-[rgba(37,99,235,0.2)]" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.1))" }}>
                    <Zap className="w-4 h-4 text-[var(--navy-300)]" />
                  </div>
                  <div>
                    <span className="text-xs text-white font-semibold block">AI Tahlil</span>
                    <span className="text-[10px] text-slate-400">Gemini Flash</span>
                  </div>
                </div>
              </div>

              <div className="absolute -right-6 bottom-16 glass-dark rounded-2xl p-3.5 animate-float border border-[rgba(212,168,83,0.2)]" style={{ animationDelay: "1.5s", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(212,168,83,0.2), rgba(212,168,83,0.1))" }}>
                    <Shield className="w-4 h-4 text-[var(--gold-400)]" />
                  </div>
                  <div>
                    <span className="text-xs text-white font-semibold block">100% Xavfsiz</span>
                    <span className="text-[10px] text-slate-400">Zero Storage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }} />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <ChevronDown className="w-5 h-5 text-slate-500" />
      </div>
    </section>
  );
}
