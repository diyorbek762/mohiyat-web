"use client";

import React, { useState, useRef } from 'react';
import { FileText, Plus, X, ArrowRight, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { scanDocument } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { validateFile, formatFileSize, ALLOWED_EXTENSIONS } from "@/lib/utils";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showBotRedirect, setShowBotRedirect] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    setShowBotRedirect(false);
    
    const err = validateFile(file);
    if (err === "TG_BOT_REDIRECT") {
      setShowBotRedirect(true);
      setSelectedFile(null);
      return;
    }
    if (err) { 
      setError(err); 
      setSelectedFile(null); 
      return; 
    }
    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const startAnalysis = async () => {
    if (!selectedFile) {
      setError("Iltimos, avval hujjat yuklang.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 12;
      });
    }, 500);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const result = await scanDocument(selectedFile, 'rag_auto', session?.user?.id);
      
      setProgress(100);
      clearInterval(progressInterval);
      
      setTimeout(() => {
        if (result.session_id && result.session_id !== "temp-session") {
          router.push(`/results/${result.session_id}`);
        } else {
          // If the backend doesn't return a valid UUID for some reason (e.g. failure to save)
          // we could pass state via history, but it's better to ensure DB saves it.
          // For now, if no ID is returned, we handle gracefully.
          setError("Tahlil qilindi, ammo bazaga saqlanmadi.");
          setIsProcessing(false);
        }
      }, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setIsProcessing(false);
      clearInterval(progressInterval);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full overflow-y-auto">
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 pt-12 md:pt-16 pb-28 md:pb-40 px-6 md:px-12 rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 md:w-96 md:h-96 rounded-full bg-white opacity-10 blur-2xl md:blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 md:w-64 md:h-64 rounded-full bg-white opacity-10 blur-xl md:blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 md:mb-2 text-blue-100 text-sm md:text-base font-medium">
              <span>Salom!</span>
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Mohiyat AI</h1>
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-lg border border-white/30">
                V2
              </span>
            </div>
            <p className="hidden md:block text-blue-100/80 mt-3 max-w-md">
              Shartnomalaringizni sun'iy intellekt orqali O'zbekiston qonunchiligiga asosan xavfsiz tahlil qiling.
            </p>
          </div>
        </div>
      </div>

      <div className="-mt-16 md:-mt-24 px-5 md:px-12 relative z-10 flex-1 flex flex-col max-w-5xl mx-auto w-full mb-8">
        <div 
          className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex-1 flex flex-col"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input 
            ref={inputRef} 
            type="file" 
            className="hidden" 
            accept={ALLOWED_EXTENSIONS.join(",")} 
            onChange={handleInputChange} 
          />

          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg md:text-xl">Hujjatlar</h3>
            {selectedFile && (
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100">
                <FileText className="w-3.5 h-3.5" /> 1 ta fayl
              </div>
            )}
          </div>

          {error && !showBotRedirect && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>
            </div>
          )}

          {showBotRedirect && (
            <div className="mb-6 p-5 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm flex flex-col gap-3 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.198-.054-.31-.346-.116l-6.405 4.028-2.76-.863c-.6-.187-.611-.6.125-.89l10.796-4.158c.498-.186.938.113.784.84z"/></svg>
                </div>
                <div>
                  <h4 className="text-indigo-900 font-bold">Fayl formati bu yerda qo'llab-quvvatlanmaydi!</h4>
                  <p className="text-indigo-700 text-sm font-medium mt-1">
                    Sayt faqat PDF bilan ishlaydi. <b>Rasm</b> yoki <b>Word (DOCX)</b> fayllarini tahlil qilish uchun o'zimizning aqlli Telegram botimizga yuboring.
                  </p>
                </div>
              </div>
              <a 
                href="https://t.me/MohiyatAIBot" 
                target="_blank" 
                rel="noreferrer"
                className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                Telegram Botga O'tish
              </a>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-8">
            {selectedFile ? (
              <div className="relative w-32 h-44 md:w-40 md:h-56 bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-slate-200 shrink-0 transform transition-transform hover:-translate-y-1 group flex flex-col items-center justify-center p-4">
                <FileText className="w-12 h-12 text-blue-500 mb-2" />
                <p className="text-xs font-bold text-slate-700 text-center truncate w-full">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="absolute -top-3 -right-3 w-8 h-8 md:opacity-0 md:group-hover:opacity-100 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-md border border-slate-100 transition-all z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => inputRef.current?.click()}
                className="w-full h-44 md:h-56 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all shrink-0 group"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
                </div>
                <span className="text-sm font-bold">Fayl yuklash</span>
                <span className="text-xs text-slate-500 font-medium mt-1">Faqat PDF formatida (Max 4MB)</span>
              </button>
            )}
          </div>

          <div className="mt-auto">
            {isProcessing ? (
              <div className="w-full bg-blue-50 py-4 md:py-5 rounded-2xl flex flex-col items-center justify-center border border-blue-100 shadow-inner">
                 <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                 <span className="text-sm font-bold text-blue-800 mb-2">Tahlil qilinmoqda... {Math.round(progress)}%</span>
                 <div className="w-64 h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                 </div>
              </div>
            ) : (
              <button 
                onClick={startAnalysis}
                disabled={!selectedFile}
                className={`w-full ${selectedFile ? 'bg-blue-600 hover:bg-blue-700 shadow-[0_8px_20px_rgb(37,99,235,0.3)] hover:shadow-[0_12px_25px_rgb(37,99,235,0.4)]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} text-white py-4 md:py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] group`}
              >
                <FileText className="w-5 h-5" /> 
                Tahlil qilish
                {selectedFile && <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform ml-1" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
