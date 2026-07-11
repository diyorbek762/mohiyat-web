"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { DocumentViewerModal } from "@/components/results/DocumentViewerModal";

interface ScanSession {
  id: string;
  short_title: string;
  created_at: string;
  crm_counterparty: string | null;
  crm_amount: number | null;
  crm_currency: string | null;
  crm_deadline: string | null;
  risk_score: number;
}

export default function CRMPage() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanSession[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Document Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerText, setViewerText] = useState("");
  const [viewerHighlight, setViewerHighlight] = useState<string | null>(null);
  const [viewerSessionId, setViewerSessionId] = useState("");
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCRMData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("scan_sessions")
        .select("id, short_title, created_at, crm_counterparty, crm_amount, crm_currency, crm_deadline, risk_score")
        .eq("user_id", session.user.id)
        .eq("in_crm", true)
        .order("created_at", { ascending: false });

      if (data && !error) {
        setScans(data);
      }
      
      const { data: alertData } = await supabase
          .from("app_notifications")
          .select("*")
          .eq("user_id", session.user.id)
          .like("title", "%Muddat%")
          .order("created_at", { ascending: false })
          .limit(5);
      if (alertData) setAlerts(alertData);
      
      setLoading(false);
    }
    fetchCRMData();
  }, []);

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return "Summa yo'q";
    return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: currency || "UZS" }).format(amount);
  };

  if (loading) {
    return <div className="p-8 text-center text-white/50">Yuklanmoqda...</div>;
  }

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Ushbu hujjatni CRM dan o'chirmoqchimisiz? Tarixda qoladi.")) return;
    
    // Optimistic UI update
    setScans(scans.filter(s => s.id !== id));
    
    const { error } = await supabase
      .from("scan_sessions")
      .update({ in_crm: false })
      .eq("id", id);
      
    if (error) {
      console.error("Failed to remove from CRM:", error);
      // Optional: Handle error by refreshing data
    }
  };

  const handleViewAlert = async (alert: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (!alert.link_url) return;

    // e.g. /results/123-456?highlight=muddat
    const urlObj = new URL(alert.link_url, window.location.origin);
    const pathParts = urlObj.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 1];
    const highlight = urlObj.searchParams.get("highlight");

    setViewerSessionId(sessionId);
    setViewerHighlight(highlight);
    setActiveAlertId(alert.id);
    
    // Fetch document text
    let text = "";
    try {
      const res = await fetch(`/api/document/${sessionId}/text`);
      if (res.ok) {
        const json = await res.json();
        text = json.text || "";
      }
    } catch (e) {
      console.error("Error fetching text:", e);
    }
    
    setViewerText(text);
    
    setViewerOpen(true);
  };

  const handleViewOriginal = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewerSessionId(sessionId);
    setViewerHighlight(null);
    setActiveAlertId(null);
    
    // Fetch document text
    let text = "";
    try {
      const res = await fetch(`/api/document/${sessionId}/text`);
      if (res.ok) {
        const json = await res.json();
        text = json.text || "";
      }
    } catch (e) {
      console.error("Error fetching text:", e);
    }
    
    setViewerText(text);
    
    setViewerOpen(true);
  };

  const handleCloseViewer = async () => {
    setViewerOpen(false);
    if (activeAlertId) {
      // Remove alert from state
      setAlerts(alerts.filter(a => a.id !== activeAlertId));
      
      // Delete alert from DB
      await supabase
        .from("app_notifications")
        .delete()
        .eq("id", activeAlertId);
        
      setActiveAlertId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            B2B Shartnomalar Arhivi
          </h1>
          <p className="text-white/60">Kompaniya shartnomalari, moliyaviy majburiyatlar va muddatlar paneli.</p>
        </div>
        <button 
          onClick={() => router.push('/upload?crm=true')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Yangi qo'shish
        </button>
      </div>

      {alerts.length > 0 && (
        <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <h2 className="text-red-400 font-bold flex items-center gap-2 mb-4">
            <span className="text-xl">⚠️</span> AI Agent Eslatmalari
          </h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-black/20 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-white mb-1">{alert.title}</div>
                  <div className="text-sm text-white/70">{alert.message}</div>
                </div>
                {alert.link_url && (
                  <button onClick={(e) => handleViewAlert(alert, e)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-bold transition-colors">
                    Ko'rish
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scans.map((scan) => {
          const isExpiring = scan.crm_deadline ? new Date(scan.crm_deadline).getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000 : false;
          
          return (
            <div 
              key={scan.id} 
              onClick={() => router.push(`/results/${scan.id}`)}
              className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 flex flex-col gap-2 items-end">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${scan.risk_score > 60 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  Xavf: {scan.risk_score}%
                </span>
                <button 
                  onClick={(e) => handleRemove(scan.id, e)}
                  className="p-1.5 bg-black/40 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg transition-colors"
                  title="CRM dan o'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold mb-1 text-white truncate pr-16">{scan.short_title}</h3>
              <p className="text-sm text-white/50 mb-4">{scan.crm_counterparty || "Noma'lum tomon"}</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                  <span className="text-white/50 text-sm">Summa</span>
                  <span className="font-mono font-semibold text-green-400">{formatCurrency(scan.crm_amount, scan.crm_currency)}</span>
                </div>
                
                <div className={`flex justify-between items-center p-3 rounded-lg ${isExpiring ? 'bg-red-500/10 border border-red-500/20' : 'bg-black/20'}`}>
                  <span className="text-white/50 text-sm">Muddat</span>
                  <span className={`font-mono text-sm ${isExpiring ? 'text-red-400 font-bold' : 'text-white'}`}>
                    {scan.crm_deadline ? format(new Date(scan.crm_deadline), "d MMM, yyyy", { locale: uz }) : "Cheksiz"}
                  </span>
                </div>
              </div>

              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                <div className={`h-full ${isExpiring ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: '100%' }}></div>
              </div>

              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => router.push(`/results/${scan.id}`)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm font-bold transition-colors text-center"
                >
                  Natija
                </button>
                <button 
                  onClick={(e) => handleViewOriginal(scan.id, e)}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 py-2 rounded-xl text-sm font-bold transition-colors text-center"
                >
                  Asl Hujjat
                </button>
              </div>
            </div>
          );
        })}
        {scans.length === 0 && (
          <div className="col-span-full py-12 text-center text-white/50 border border-dashed border-white/10 rounded-2xl">
            Hali hech qanday shartnoma yuklanmagan.
          </div>
        )}
      </div>

      <DocumentViewerModal
        isOpen={viewerOpen}
        setIsOpen={(val) => {
          if (!val) handleCloseViewer();
        }}
        documentText={viewerText}
        highlightQuery={viewerHighlight}
        sessionId={viewerSessionId}
      />
    </div>
  );
}
