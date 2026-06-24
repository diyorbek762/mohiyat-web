"use client";

import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer-gradient py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--navy-50)" }}>
                <Shield className="w-4 h-4 text-[var(--navy-600)]" strokeWidth={2.2} />
              </div>
              <span className="text-base font-semibold text-[var(--foreground)]">Mohiyat<span className="text-[var(--navy-500)] font-normal ml-0.5">AI</span></span>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed max-w-xs">
              Kichik biznes va frilanserlar uchun avtomatik yuridik himoya. O&apos;zbekiston qonunchiligiga asoslangan.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Sahifalar</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-xs text-[var(--foreground-muted)] hover:text-[var(--navy-600)] transition-colors">Xususiyatlar</a></li>
              <li><a href="#how-it-works" className="text-xs text-[var(--foreground-muted)] hover:text-[var(--navy-600)] transition-colors">Qanday ishlaydi</a></li>
              <li><a href="#upload" className="text-xs text-[var(--foreground-muted)] hover:text-[var(--navy-600)] transition-colors">Shartnoma tekshirish</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Aloqa</h4>
            <ul className="space-y-2">
              <li><span className="text-xs text-[var(--foreground-muted)]">info@mohiyat.uz</span></li>
              <li><span className="text-xs text-[var(--foreground-muted)]">Toshkent, O&apos;zbekiston</span></li>
            </ul>
          </div>
        </div>

        <div className="section-divider mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--foreground-muted)]">&copy; {new Date().getFullYear()} Mohiyat AI. Barcha huquqlar himoyalangan.</p>
          <p className="text-[10px] text-[var(--foreground-muted)]">
            Ogohlantirish: Bu xizmat yuridik maslahat emas. Professional huquqshunos bilan maslahatlashing.
          </p>
        </div>
      </div>
    </footer>
  );
}
