"use client";

import { useEffect } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary caught an error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Kutilmagan Xatolik Yuz Berdi</h1>
      <p className="text-slate-600 font-medium max-w-md mb-8">
        Kechirasiz, tizimda kutilmagan nosozlik kuzatildi. Iltimos, sahifani yangilang yoki asosiy sahifaga qayting.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 font-bold shadow-sm transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          Qayta urinish
        </button>
        <Link 
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md shadow-blue-600/20 transition-all"
        >
          <Home className="w-5 h-5" />
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
