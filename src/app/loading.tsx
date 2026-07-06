import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 border-4 border-t-blue-600 border-r-blue-500 border-b-blue-400 border-l-transparent rounded-full animate-spin opacity-20"></div>
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Yuklanmoqda...</h2>
      <p className="text-sm font-medium text-slate-500 animate-pulse">Iltimos, kuting</p>
    </div>
  );
}
