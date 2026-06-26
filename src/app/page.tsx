"use client";

import React, { useState, useCallback, useRef } from 'react';
import { 
  Home, Clock, User, Settings, Camera, Image as ImageIcon, Plus, X, 
  FileText, Scale, GitCompare, AlertTriangle, ListTodo, ThumbsUp, ThumbsDown, Award,
  ChevronDown, Building2, Trash2, Search, Sparkles, ArrowRight, Menu, Loader2,
  LogOut, Mail, Lock, Phone, Coins, Shield, Bell
} from 'lucide-react';
import AdminScreen from '@/components/AdminScreen';
import { scanDocument } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { ScanResult } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { validateFile, formatFileSize, ALLOWED_EXTENSIONS } from "@/lib/utils";
import posthog from 'posthog-js';

import CustomDialog from "@/components/CustomDialog";

// --- REUSABLE COMPONENTS ---

interface AnalysisCardProps {
  title: string;
  icon: React.ElementType;
  colorTheme: 'blue' | 'purple' | 'orange' | 'red' | 'green' | 'gold';
  sectionRef?: string;
  legalBasis?: string;
  recommendation?: string;
}

const AnalysisCard = ({ title, icon: Icon, colorTheme, sectionRef, legalBasis, recommendation }: AnalysisCardProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const themeStyles = {
    blue: { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50/50', border: 'border-purple-100', text: 'text-purple-700', iconBg: 'bg-purple-100' },
    orange: { bg: 'bg-orange-50/50', border: 'border-orange-100', text: 'text-orange-700', iconBg: 'bg-orange-100' },
    red: { bg: 'bg-red-50/50', border: 'border-red-100', text: 'text-red-700', iconBg: 'bg-red-100' },
    green: { bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    gold: { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100' },
  };

  const style = themeStyles[colorTheme] || themeStyles.blue;

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${style.iconBg} shrink-0`}>
          <Icon className={`w-5 h-5 ${style.text}`} strokeWidth={2.5} />
        </div>
        <h3 className={`font-bold text-base leading-snug ${style.text}`}>{title}</h3>
      </div>

      {sectionRef && (
        <p className="text-xs text-slate-500 font-medium mb-2">
          <span className="font-bold text-slate-600">Bo'lim:</span> {sectionRef}
        </p>
      )}

      {recommendation && (
        <p className="text-sm text-slate-700 font-medium leading-relaxed mb-3">{recommendation}</p>
      )}

      {legalBasis && (
        <>
          {isExpanded && (
            <div className="mb-3 bg-white/80 rounded-xl p-3 border border-slate-100 animate-in fade-in duration-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📜 Qonuniy asos</p>
              <p className="text-sm text-slate-700 font-semibold">{legalBasis}</p>
            </div>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-auto"
          >
            <Scale className="w-3.5 h-3.5 text-slate-400" /> {isExpanded ? 'Yopish' : 'Qonuniy asosni ko\'rish'} <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </>
      )}
    </div>
  );
};

const Navigation = ({ activeTab, setActiveTab, userProfile }: { activeTab: string, setActiveTab: (t: string) => void, userProfile?: any }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Asosiy' },
    { id: 'history', icon: Clock, label: 'Tarix' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  if (userProfile?.is_admin) {
    navItems.push({ id: 'admin', icon: Shield, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 w-full h-20 bg-white border-t border-slate-100 z-50 rounded-t-3xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] 
                    md:relative md:w-64 md:h-screen md:rounded-none md:border-t-0 md:border-r md:flex md:flex-col md:px-4 md:py-6 md:shadow-none transition-all">
      
      <div className="hidden md:flex items-center gap-3 px-4 mb-10 mt-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-slate-900">Mohiyat AI</span>
      </div>

      <div className="flex justify-around items-center h-full md:flex-col md:justify-start md:gap-2">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col md:flex-row items-center md:justify-start gap-1.5 md:gap-4 w-20 md:w-full md:px-4 md:py-3.5 rounded-2xl transition-all ${
              activeTab === item.id 
                ? 'text-blue-600 md:bg-blue-50 md:text-blue-700 font-bold' 
                : 'text-slate-400 hover:text-slate-600 md:hover:bg-slate-50 font-medium'
            }`}
          >
            <div className={`p-1.5 md:p-0 rounded-full transition-all ${activeTab === item.id ? 'bg-blue-50 md:bg-transparent' : ''}`}>
              <item.icon className="w-6 h-6 md:w-5 md:h-5" strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className="text-[10px] md:text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="hidden md:block mt-auto">
        {userProfile !== undefined && (
          <div className="mx-4 mb-4 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <Coins className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Balans</p>
                <p className="text-xl font-black text-amber-900 leading-none mt-0.5">{userProfile?.balance ?? 0} <span className="text-sm font-bold text-amber-600">Coin</span></p>
              </div>
            </div>
          </div>
        )}
        <div className="px-6 py-4 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity mt-4 mb-6">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Crafted by</p>
          <a href="mailto:dedamirzayevdiyorbek9@gmail.com" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors">Dedamirzayev Diyorbek</a>
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [appState, setAppState] = useState<'upload' | 'results'>('upload');
  
  // State for file upload & processing
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  
  const [cameFromHistory, setCameFromHistory] = useState(false);
  
  // History State
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [activeAlert, setActiveAlert] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Initial fetch for alerts
    supabase.from('app_alerts').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0) setActiveAlert(data[0]);
    });

    // Realtime subscription for instant popups
    const alertsChannel = supabase.channel('realtime_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_alerts' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.is_active) {
          setActiveAlert(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.is_active) {
            setActiveAlert(payload.new);
          } else {
            setActiveAlert(null);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  React.useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN') {
        setActiveTab('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Profile data
  React.useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) setUserProfile(data);
      });
    } else {
      setUserProfile(null);
    }
  }, [user]);


  React.useEffect(() => {
    if (activeTab === 'history' && user) {
      setIsLoadingHistory(true);
      supabase
        .from('scan_sessions')
        .select('id, short_title, created_at, risk_score, full_report')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setHistoryRecords(data);
          }
          setIsLoadingHistory(false);
        });
    }
  }, [activeTab, user]);

  const handleFile = (file: File) => {
    setError(null);
    const err = validateFile(file);
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
      // Vector RAG automatically figures out the codex
      const result = await scanDocument(selectedFile, 'rag_auto', user?.id);
      setProgress(100);
      setTimeout(() => {
        setScanResult(result);
        setIsProcessing(false);
        setAppState('results');
      }, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setIsProcessing(false);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    setFeedbackGiven(false);
  };

  const UploadScreen = () => (
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
            <p className="hidden md:block text-blue-100/80 mt-3 max-w-md">Shartnomalaringizni sun'iy intellekt orqali O'zbekiston qonunchiligiga asosan xavfsiz tahlil qiling.</p>
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

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-8">
            {selectedFile ? (
              <div className="relative w-32 h-44 md:w-40 md:h-56 bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-slate-200 shrink-0 transform transition-transform hover:-translate-y-1 group flex flex-col items-center justify-center p-4">
                <FileText className="w-12 h-12 text-blue-500 mb-2" />
                <p className="text-xs font-bold text-slate-700 text-center truncate w-full">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                <button 
                  onClick={clearFile}
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
                <span className="text-xs text-slate-500 font-medium mt-1">PDF, DOCX yoki rasm formatida</span>
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

          <div className="mt-12 md:hidden text-center opacity-60 pb-8">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Crafted by</p>
            <a href="mailto:dedamirzayevdiyorbek9@gmail.com" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors">Dedamirzayev Diyorbek</a>
          </div>
        </div>
      </div>
    </div>
  );

  const ResultsScreen = () => {
    if (!scanResult) return null;

    const { risk_score, blind_spots, summary } = scanResult;
    const isHighRisk = risk_score >= 70;
    const isMediumRisk = risk_score >= 40 && risk_score < 70;
    
    const riskColorClass = isHighRisk ? "text-red-600" : isMediumRisk ? "text-orange-500" : "text-emerald-600";
    const riskBgClass = isHighRisk ? "bg-red-50 border-red-100" : isMediumRisk ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100";
    const riskGradientClass = isHighRisk ? "from-red-400 to-red-600" : isMediumRisk ? "from-orange-400 to-orange-500" : "from-emerald-400 to-emerald-600";
    const riskLabel = isHighRisk ? "Xavfli Hujjat" : isMediumRisk ? "O'rtacha Xavf" : "Xavfsiz Hujjat";

    return (
      <div className="flex-1 flex flex-col bg-slate-50 relative w-full h-full overflow-y-auto">
        <div className="bg-white/80 backdrop-blur-xl pt-6 pb-4 px-5 md:px-10 border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-sm sticky top-0">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <button onClick={() => { 
              if (cameFromHistory) {
                setCameFromHistory(false);
                setAppState('upload');
                setActiveTab('history');
              } else {
                setAppState('upload'); 
                clearFile(); 
              }
            }} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 bg-slate-100/50 hover:bg-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors font-medium text-sm">
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span className="hidden md:block">{cameFromHistory ? 'Tarixga qaytish' : 'Yopish'}</span>
            </button>
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800 absolute left-1/2 -translate-x-1/2">Tahlil Natijasi</h1>
            <div className="w-20"></div>
          </div>
        </div>

        <div className="flex-1 p-5 md:p-8 pb-8">
          <div className="max-w-5xl mx-auto space-y-5 md:space-y-6">
            
            <div className={`bg-white rounded-3xl border p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden ${riskBgClass}`}>
              <div className={`absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none ${isHighRisk ? 'bg-red-100' : isMediumRisk ? 'bg-orange-100' : 'bg-emerald-100'}`}></div>
              
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={`${riskColorClass} drop-shadow-sm`} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${risk_score}, 100`} stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                  <span className={`text-3xl md:text-4xl font-black ${riskColorClass} leading-none`}>{risk_score}</span>
                  <span className="text-xs md:text-sm font-bold text-slate-400 mt-1">/ 100</span>
                </div>
              </div>
              
              <div className="flex-1 relative z-10 w-full text-center md:text-left">
                <h2 className={`text-3xl md:text-4xl font-black ${riskColorClass} mb-2 md:mb-3 tracking-tight`}>{riskLabel}</h2>
                <p className="text-sm md:text-base text-slate-600 font-medium mb-4 md:mb-6">
                  {summary || "AI shartnomani tekshirib chiqdi. Quyidagi natijalarga e'tibor bering."}
                </p>
                <div className="h-2 md:h-3 w-full bg-slate-100 rounded-full overflow-hidden max-w-md mx-auto md:mx-0">
                  <div className={`h-full bg-gradient-to-r ${riskGradientClass} rounded-full shadow-inner`} style={{ width: `${risk_score}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
              {blind_spots && blind_spots.length > 0 ? (
                blind_spots.map((spot: any, idx: number) => {
                  const theme = spot.color_theme || (spot.severity === 'high' ? 'red' : spot.severity === 'medium' ? 'orange' : spot.severity === 'info' ? 'blue' : 'green');
                  
                  let IconComponent = FileText;
                  const t = spot.title.toLowerCase();
                  if (t.includes('xavf') || t.includes('jarima') || t.includes('zarar') || t.includes('zid') || t.includes('asossiz')) IconComponent = AlertTriangle;
                  else if (t.includes("to'lov") || t.includes('ish haqi') || t.includes('foyda') || t.includes('moliyaviy')) IconComponent = Coins;
                  else if (t.includes('vaqti') || t.includes('muddat')) IconComponent = Clock;
                  else if (t.includes('kafolat') || t.includes('xavfsizlik')) IconComponent = Shield;
                  else if (t.includes('tavsiya') || t.includes('qilish kerak') || t.includes('muzokara') || t.includes('harakat')) IconComponent = ListTodo;
                  else if (t.includes('majburiyat') || t.includes('vazifa') || t.includes('sifat') || t.includes('xulosa')) IconComponent = Award;
                  else if (t.includes('sir') || t.includes('mulk') || t.includes('maxfiy')) IconComponent = Lock;

                  return (
                    <AnalysisCard key={idx} title={spot.title} icon={IconComponent} colorTheme={theme} sectionRef={spot.section_ref} legalBasis={spot.legal_basis} recommendation={spot.recommendation} />
                  )
                })
              ) : (
                <AnalysisCard title="Xavflar topilmadi" icon={ThumbsUp} colorTheme="green" recommendation="Shartnomada ochiq xavfli bandlar aniqlanmadi. Baribir mutaxassis bilan maslahatlashish tavsiya etiladi." />
              )}
            </div>



            {/* Feedback & Actions Footer */}
            <div className="pt-6 pb-8 border-t border-slate-200 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm md:text-base">Tahlil foydali bo'ldimi?</h4>
                  <p className="text-xs text-slate-500 mt-1">Sizning fikringiz sun'iy intellektni yaxshilashga yordam beradi.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {feedbackGiven ? (
                    <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-emerald-100 w-full animate-scale-in">
                      <Sparkles className="w-4 h-4" /> Rahmat, qabul qilindi!
                    </div>
                  ) : (
                    <>
                      <button onClick={() => { posthog?.capture('analysis_feedback', { type: 'thumbs_up' }); setFeedbackGiven(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl font-bold text-sm transition-colors border border-slate-200 hover:border-emerald-200">
                        <ThumbsUp className="w-4 h-4" /> Yaxshi
                      </button>
                      <button onClick={() => { posthog?.capture('analysis_feedback', { type: 'thumbs_down' }); setFeedbackGiven(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold text-sm transition-colors border border-slate-200 hover:border-red-200">
                        <ThumbsDown className="w-4 h-4" /> Yomon
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-center md:text-left text-slate-400 text-[10px] md:text-xs font-medium max-w-xl leading-relaxed">
                  <strong className="text-slate-500">DIQQAT:</strong> Mohiyat AI – bu avtomatlashtirilgan sun'iy intellekt tizimi, professional yurist emas. Ushbu tahlil yuridik maslahat hisoblanmaydi va unda xatoliklar bo'lishi mumkin. Yakuniy qaror qabul qilishdan oldin har doim mutaxassis bilan maslahatlashing.
                </p>
                <button 
                  onClick={() => { setAppState('upload'); clearFile(); }}
                  className="w-full md:w-auto md:px-8 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold md:text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0"
                >
                  Yangi hujjat tekshirish
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  const HistoryScreen = () => {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 relative w-full h-full overflow-y-auto">
        <div className="bg-white/80 backdrop-blur-xl pt-6 pb-4 px-5 md:px-10 border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-sm sticky top-0">
          <div className="max-w-5xl mx-auto w-full">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800">Saqlangan Tahlillar</h1>
          </div>
        </div>
        <div className="flex-1 p-5 md:p-8">
          <div className="max-w-5xl mx-auto">
            {isLoadingHistory ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : historyRecords.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tarix bo'sh yoki tizimga kirmagansiz</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {historyRecords.map(record => (
                  <div key={record.id} 
                       onClick={() => {
                         setScanResult({
                           session_id: record.id,
                           risk_score: record.risk_score || 0,
                           blind_spots: record.full_report?.blind_spots || [],
                           summary: record.full_report?.overall_summary || record.short_title || "Saqlangan tahlil",
                           page_count: 1,
                           processing_ms: 0,
                           model_used: "history"
                         });
                         setCameFromHistory(true);
                         setAppState('results');
                         setActiveTab('home');
                       }}
                       className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{record.short_title || "Shartnoma"}</h3>
                        <p className="text-xs text-slate-500">{new Date(record.created_at).toLocaleString('uz-UZ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {record.full_report ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">Premium</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Qulflangan</span>
                      )}
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
              data: {
                full_name: fullName,
                phone: phone
              }
            }
          });
          if (error) throw error;
          
          if (!data.session) {
            setErrorMsg("Muvaffaqiyatli! Iltimos pochtangizga kirib tasdiqlash ssilkasi ustiga bosing (Yoki Supabase'dan 'Confirm Email' ni o'chiring).");
            return;
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
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
        options: { redirectTo: window.location.origin }
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

          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><Scale className="w-16 h-16" /></div>
            <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 relative z-10">
              <Scale className="w-4 h-4" /> UZCombinator hakamlari uchun
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed relative z-10">
              Iltimos, loyiha imkoniyatlari va tahlillar tarixini baholash uchun quyidagi tayyor hisobdan foydalaning (API limitlari cheklanganligi sababli):
            </p>
            <div className="mt-1 bg-white/60 p-2.5 rounded-lg border border-blue-100 font-mono text-xs text-slate-700 relative z-10">
              <div className="flex flex-col sm:flex-row sm:justify-between mb-2 sm:mb-1 gap-1">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Email</span> 
                <span className="font-medium text-blue-900 select-all">dedamirzayevdiyorbek9@gmail.com</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Parol</span> 
                <span className="font-medium text-blue-900 select-all">Uzcombinator2026!</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                {errorMsg === "Invalid login credentials" ? "Email yoki parol noto'g'ri" : 
                 errorMsg === "User already registered" ? "Bu email ro'yxatdan o'tgan" : 
                 errorMsg === "Email not confirmed" ? "Pochtani tasdiqlash xati yuborilgan. Tasdiqlang yoki Supabase'dan bekor qiling." :
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
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
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
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
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
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
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
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
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

          <div className="mt-12 text-center opacity-70">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Crafted by</p>
            <a href="mailto:dedamirzayevdiyorbek9@gmail.com" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Dedamirzayev Diyorbek</a>
          </div>
        </div>
      </div>
    );
  };

  const ProfileScreen = ({ userProfile }: { userProfile?: any }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(userProfile?.full_name || '');
    const [phone, setPhone] = useState(userProfile?.phone || '');
    const [saving, setSaving] = useState(false);

    // Dialog States for Profile
    const [promoDialog, setPromoDialog] = useState({ isOpen: false });
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false });
    const [buyCoinsDialog, setBuyCoinsDialog] = useState({ isOpen: false });
    const [successDialog, setSuccessDialog] = useState({ isOpen: false, title: '', msg: '' });
    const [errorDialog, setErrorDialog] = useState({ isOpen: false, msg: '' });

    const handleSave = async () => {
      setSaving(true);
      await supabase.from('profiles').update({ full_name: name, phone: phone }).eq('id', user?.id);
      setSaving(false);
      setIsEditing(false);
      window.location.reload(); // Refresh to get updated data
    };

    const handleDelete = () => setDeleteDialog({ isOpen: true });

    const handleConfirmDelete = async () => {
      setDeleteDialog({ isOpen: false });
      await supabase.rpc('delete_user');
      window.location.reload();
    };

    const handleRedeemPromo = () => setPromoDialog({ isOpen: true });

    const handleConfirmPromo = async (code?: string) => {
      if (!code) return;
      try {
        const { data, error } = await supabase.rpc('redeem_promocode', { p_code: code.toUpperCase() });
        if (error) throw error;
        setPromoDialog({ isOpen: false });
        setSuccessDialog({ isOpen: true, title: 'Muvaffaqiyatli!', msg: `Tabriklaymiz! Sizga ${data.reward} Coin berildi!` });
        // After dialog closes, we will reload
      } catch (e: any) {
        setPromoDialog({ isOpen: false });
        setErrorDialog({ isOpen: true, msg: e.message });
      }
    };

    return (
      <div className="flex-1 flex flex-col bg-slate-50 relative w-full h-full overflow-y-auto">
        <div className="bg-white/80 backdrop-blur-xl pt-6 pb-4 px-5 md:px-10 border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-sm sticky top-0">
          <div className="max-w-5xl mx-auto w-full">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800">Shaxsiy Profil</h1>
          </div>
        </div>
        <div className="flex-1 p-5 md:p-8">
          <div className="max-w-xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between mb-8 bg-amber-50 p-4 rounded-2xl border border-amber-100 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shadow-sm"><Coins className="text-amber-500 w-6 h-6" /></div>
                <div>
                  <p className="text-xs text-amber-700 font-bold uppercase">Tangalar</p>
                  <p className="text-xl font-black text-amber-900">{userProfile?.balance ?? 0} Coin</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRedeemPromo} className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-100 transition-colors">Promokod</button>
                <button onClick={() => setBuyCoinsDialog({ isOpen: true })} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-amber-600 transition-colors">To'ldirish</button>
              </div>
            </div>

            <div className="w-full space-y-4 mb-10">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Ism va familiya</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium disabled:opacity-70 disabled:bg-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Telefon raqam</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-slate-400" /></div>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEditing} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium disabled:opacity-70 disabled:bg-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Elektron pochta (O'zgartirib bo'lmaydi)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                  <input type="email" value={user?.email || ''} disabled className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-medium opacity-70 cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div className="w-full flex gap-3 mb-10">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Bekor qilish</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Saqlash"}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-md">Ma'lumotlarni tahrirlash</button>
              )}
            </div>

            <div className="w-full border-t border-slate-100 pt-8 flex flex-col gap-3">
              <button 
                onClick={() => supabase.auth.signOut()}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200"
              >
                <LogOut className="w-5 h-5" /> Tizimdan chiqish
              </button>

              <button 
                onClick={handleDelete}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors border border-red-100 mt-4"
              >
                <Trash2 className="w-5 h-5" /> Akkauntni butunlay o'chirish
              </button>
            </div>
          </div>
        </div>

        {/* Profile Dialogs */}
        <CustomDialog 
          isOpen={buyCoinsDialog.isOpen}
          type="confirm"
          theme="amber"
          title="Tangalar sotib olish"
          description="Tangalar sotib olish yoki so'rash uchun loyiha asoschisi (@d1yorbek19) ga Telegram orqali murojaat qiling. O'z akkaunt emailingizni aytishni unutmang!"
          confirmText="Telegramga o'tish"
          onClose={() => setBuyCoinsDialog({ isOpen: false })}
          onConfirm={() => {
            setBuyCoinsDialog({ isOpen: false });
            window.open("https://t.me/d1yorbek19", "_blank");
          }}
        />

        <CustomDialog 
          isOpen={promoDialog.isOpen}
          type="prompt"
          theme="blue"
          title="Promokod"
          description="Sizda promokod bormi? Uni kiriting va bepul coinlarga ega bo'ling."
          placeholder="PROMO2026"
          onClose={() => setPromoDialog({ isOpen: false })}
          onConfirm={handleConfirmPromo}
        />
        
        <CustomDialog 
          isOpen={deleteDialog.isOpen}
          type="confirm"
          theme="red"
          title="Akkauntni o'chirish"
          description="Rostdan ham akkauntingizni butunlay o'chirmoqchimisiz? Barcha ma'lumotlar o'chib ketadi va ortga qaytarib bo'lmaydi."
          confirmText="O'chirish"
          onClose={() => setDeleteDialog({ isOpen: false })}
          onConfirm={handleConfirmDelete}
        />

        <CustomDialog 
          isOpen={successDialog.isOpen}
          type="alert"
          theme="green"
          title={successDialog.title}
          description={successDialog.msg}
          onClose={() => { setSuccessDialog({ isOpen: false, title: '', msg: '' }); window.location.reload(); }}
          onConfirm={() => { setSuccessDialog({ isOpen: false, title: '', msg: '' }); window.location.reload(); }}
        />

        <CustomDialog 
          isOpen={errorDialog.isOpen}
          type="alert"
          theme="red"
          title="Xatolik"
          description={errorDialog.msg}
          onClose={() => setErrorDialog({ isOpen: false, msg: '' })}
          onConfirm={() => setErrorDialog({ isOpen: false, msg: '' })}
        />
      </div>
    );
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      {activeAlert && (
        <div className="w-full bg-blue-600 text-white py-2.5 px-4 text-center text-sm font-bold z-[100] flex justify-center items-center gap-3 shadow-md shrink-0">
          <Bell className="w-4 h-4 shrink-0" /> 
          <span className="flex-1">{activeAlert.message}</span>
        </div>
      )}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} />
        
        <main className="flex-1 flex flex-col overflow-hidden relative pb-20 md:pb-0 h-full">
          {activeTab === 'admin' && userProfile?.is_admin ? <AdminScreen /> : 
           activeTab === 'history' ? <HistoryScreen /> : 
           activeTab === 'profile' ? <ProfileScreen userProfile={userProfile} /> : 
           appState === 'upload' ? <UploadScreen /> : <ResultsScreen />}
        </main>
      </div>
    </div>
  );
}
