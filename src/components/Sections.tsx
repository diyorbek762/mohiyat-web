"use client";

import { FileSearch, Shield, Zap, CreditCard, Share2, Eye, Scale, Clock, ChevronRight } from "lucide-react";

const steps = [
  { icon: FileSearch, title: "Shartnomani yuklang", desc: "PDF, DOCX yoki rasm formatida. Fayl serverda saqlanmaydi.", color: "#2563eb" },
  { icon: Zap, title: "AI tahlil qiladi", desc: "30 soniya ichida yashirin jarimalar va xavfli bandlarni aniqlaydi.", color: "#f59e0b" },
  { icon: Eye, title: "Xavflarni ko'ring", desc: "Aniqlangan xavflarning qisqa ro'yxati bepul ko'rsatiladi.", color: "#10b981" },
  { icon: CreditCard, title: "To'liq hisobotni oling", desc: "5,000 so'm to'lov orqali batafsil tahlil va tavsiyalarni oching.", color: "#d4a853" },
  { icon: Share2, title: "Ulashing", desc: "Hisobotni hamkorlaringizga xavfsiz havola orqali yuboring.", color: "#8b5cf6" },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.04) 0%, transparent 60%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
               style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.1)" }}>
            <Scale className="w-3.5 h-3.5 text-[var(--navy-500)]" />
            <span className="text-xs font-semibold text-[var(--navy-500)] tracking-wide uppercase">Jarayon</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">
            Qanday ishlaydi?
          </h2>
          <p className="text-lg text-[var(--foreground-muted)] mt-4 max-w-xl mx-auto">
            Besh oddiy qadamda shartnomangiz xavfsizligini tekshiring
          </p>
        </div>

        {/* Steps — horizontal timeline */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-[2px]"
               style={{ background: "linear-gradient(90deg, transparent, var(--border), var(--border), transparent)" }} />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center group">
                <div className="relative inline-flex mb-5">
                  <div className="trust-icon w-14 h-14 mx-auto transition-all group-hover:scale-110 group-hover:shadow-lg"
                       style={{ background: `linear-gradient(135deg, ${step.color}12, ${step.color}06)`, borderColor: `${step.color}20` }}>
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <div className="step-number absolute -top-1.5 -right-1.5">{i + 1}</div>
                </div>
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-2">{step.title}</h3>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Shield,
    title: "Maxfiylik kafolati",
    desc: "Faylingiz tahlildan keyin darhol o'chiriladi. Kriptografik kafolat — hech qanday ma'lumot saqlanmaydi.",
    highlight: "Zero Storage",
    gradient: "from-blue-500/10 to-blue-600/5",
  },
  {
    icon: Clock,
    title: "30 soniyada natija",
    desc: "Google Gemini AI yordamida tezkor tahlil. Oddiy shartnoma uchun 30 soniya yetarli — hech kim kutmaydi.",
    highlight: "Gemini AI",
    gradient: "from-amber-500/10 to-amber-600/5",
  },
  {
    icon: Scale,
    title: "Chuqur yuridik tahlil",
    desc: "O'zbekiston Fuqarolik Kodeksiga asoslangan. Professional yuristlar tomonidan tayyorlangan ma'lumotlar bazasi.",
    highlight: "Qonunga asoslangan",
    gradient: "from-emerald-500/10 to-emerald-600/5",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 relative" style={{ background: "var(--background-subtle)" }}>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--border), transparent)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(212,168,83,0.04) 0%, transparent 50%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
               style={{ background: "rgba(212,168,83,0.08)", border: "1px solid rgba(212,168,83,0.15)" }}>
            <Zap className="w-3.5 h-3.5 text-[var(--gold-500)]" />
            <span className="text-xs font-semibold text-[var(--gold-500)] tracking-wide uppercase">Afzalliklar</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">
            Nima uchun Mohiyat AI?
          </h2>
          <p className="text-lg text-[var(--foreground-muted)] mt-4 max-w-xl mx-auto">
            Kichik biznes va frilanserlar uchun professional yuridik himoya
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="card-glow p-7 group">
              <div className="flex items-start justify-between mb-5">
                <div className="trust-icon group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(37,99,235,0.06)", color: "var(--navy-500)" }}>
                  {feature.highlight}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">{feature.title}</h3>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed mb-5">{feature.desc}</p>
              <a href="#upload" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--navy-500)] group-hover:gap-2 transition-all">
                Boshlash <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
