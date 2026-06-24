"use client";

import { Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-dark" style={{ borderBottom: "1px solid rgba(37,99,235,0.1)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group" id="navbar-logo">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
                   style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(212,168,83,0.15))", border: "1px solid rgba(37,99,235,0.2)" }}>
                <Shield className="w-5 h-5 text-[var(--navy-300)]" strokeWidth={2.2} />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Mohiyat
                <span className="gradient-text-gold ml-0.5">AI</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { href: "#features", label: "Xususiyatlar" },
                { href: "#how-it-works", label: "Qanday ishlaydi" },
                { href: "#pricing", label: "Narxlar" },
              ].map((link) => (
                <a key={link.href} href={link.href}
                   className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA */}
            <a href="#upload"
               className="btn btn-sm group text-white font-semibold"
               style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(37,99,235,0.15))", border: "1px solid rgba(37,99,235,0.3)" }}
               id="nav-cta-upload">
              Tekshirish
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
