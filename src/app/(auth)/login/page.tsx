"use client";

import React, { useState, useEffect } from 'react';
import { Scale, Mail, Lock, User, Phone, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/upload');
      }
    });
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone: phone }
          }
        });
        if (error) throw error;
        
        if (!data.session) {
          setErrorMsg("Muvaffaqiyatli! Iltimos pochtangizga kirib tasdiqlash ssilkasi ustiga bosing.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/upload');
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/upload' }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden w-full h-[100dvh]">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 -ml-20 -mb-20"></div>
      
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl max-w-md w-full relative z-10 border border-slate-100">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 mx-auto">
          <Scale className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 text-center mb-2 tracking-tight">Mohiyat AI</h1>
        <p className="text-slate-500 text-center mb-6 text-sm font-medium leading-relaxed">
          Shartnomalarni xavfsiz tahlil qilish uchun tizimga kiring
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {errorMsg === "Invalid login credentials" ? "Email yoki parol noto'g'ri" : 
               errorMsg === "User already registered" ? "Bu email ro'yxatdan o'tgan" : 
               errorMsg === "Email not confirmed" ? "Pochtani tasdiqlash xati yuborilgan." :
               errorMsg}
            </p>
          </div>
        )}
        
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
          {isSignUp && (
            <>
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                    placeholder="Ism va familiyangiz"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required={isSignUp}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                    placeholder="Telefon raqamingiz"
                  />
                </div>
              </div>
            </>
          )}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                placeholder="Elektron pochta"
              />
            </div>
          </div>
          
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                placeholder="Parol"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-blue-600/20 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Ro'yxatdan o'tish" : "Tizimga kirish")}
          </button>
        </form>

        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">Yoki</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google orqali kirish
        </button>

        <p className="text-center mt-8 text-sm text-slate-500 font-medium">
          {isSignUp ? "Akkauntingiz bormi? " : "Akkauntingiz yo'qmi? "}
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)} 
            className="text-blue-600 font-bold hover:underline"
          >
            {isSignUp ? "Kirish" : "Ro'yxatdan o'tish"}
          </button>
        </p>
      </div>
    </div>
  );
}
