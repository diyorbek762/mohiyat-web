"use client";

import React, { useState, useEffect } from 'react';
import { Home, Clock, User, Shield, Scale, Coins } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) setUserProfile(data);
          setLoading(false);
        });
      }
    });
  }, [router]);

  const navItems = [
    { id: 'upload', icon: Home, label: 'Asosiy', path: '/upload' },
    { id: 'history', icon: Clock, label: 'Tarix', path: '/history' },
    { id: 'profile', icon: User, label: 'Profil', path: '/profile' },
  ];

  if (userProfile?.is_admin) {
    navItems.push({ id: 'admin', icon: Shield, label: 'Admin', path: '/admin' });
  }

  if (loading) return null; // Or a better skeleton

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <nav className="fixed bottom-0 w-full h-20 bg-white border-t border-slate-100 z-50 rounded-t-3xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] 
                        md:relative md:w-64 md:h-screen md:rounded-none md:border-t-0 md:border-r md:flex md:flex-col md:px-4 md:py-6 md:shadow-none transition-all">
          <div className="hidden md:flex items-center gap-3 px-4 mb-10 mt-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">Mohiyat AI</span>
          </div>

          <div className="flex justify-around items-center h-full md:flex-col md:justify-start md:gap-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <button 
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={`flex flex-col md:flex-row items-center md:justify-start gap-1.5 md:gap-4 w-20 md:w-full md:px-4 md:py-3.5 rounded-2xl transition-all ${
                    isActive 
                      ? 'text-blue-600 md:bg-blue-50 md:text-blue-700 font-bold' 
                      : 'text-slate-400 hover:text-slate-600 md:hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className={`p-1.5 md:p-0 rounded-full transition-all ${isActive ? 'bg-blue-50 md:bg-transparent' : ''}`}>
                    <item.icon className="w-6 h-6 md:w-5 md:h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] md:text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:block mt-auto">
            {userProfile && (
              <div className="mx-4 mb-4 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <Coins className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Balans</p>
                    <p className="text-xl font-black text-amber-900 leading-none mt-0.5">{userProfile.balance ?? 0} <span className="text-sm font-bold text-amber-600">Coin</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
        
        <main className="flex-1 flex flex-col overflow-hidden relative pb-20 md:pb-0 h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
