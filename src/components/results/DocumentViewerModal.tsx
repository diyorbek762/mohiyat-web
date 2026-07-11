import React, { useEffect, useRef } from 'react';
import { X, FileText, Download, ExternalLink } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  documentText?: string;
  highlightQuery?: string | null;
  sessionId: string;
}

export function DocumentViewerModal({
  isOpen,
  setIsOpen,
  documentText,
  highlightQuery,
  sessionId
}: DocumentViewerModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && highlightQuery && contentRef.current) {
      // Find the first highlighted element and scroll to it
      setTimeout(() => {
        const highlightedEl = contentRef.current?.querySelector('mark');
        if (highlightedEl) {
          highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isOpen, highlightQuery]);

  if (!isOpen) return null;

  // Format the text and apply highlighting
  let formattedHtml = '';
  if (documentText) {
    // Basic text formatting (convert newlines to <br/>)
    let escapedText = documentText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (highlightQuery) {
      // Create a regex to find the highlight query, case insensitive
      const regex = new RegExp(`(${highlightQuery})`, 'gi');
      escapedText = escapedText.replace(regex, '<mark class="bg-yellow-300 text-black px-1 rounded font-bold shadow-sm">$&</mark>');
    }
    
    // Convert newlines to paragraphs/breaks for better readability
    formattedHtml = escapedText.split('\n').map(p => `<p class="mb-3">${p}</p>`).join('');
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)" }}>
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] md:h-[85vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Asl Hujjat Matni</h2>
              {highlightQuery && (
                <p className="text-xs text-slate-400">"{highlightQuery}" qidirilmoqda...</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.open(`/api/document/${sessionId}`, '_blank')}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
              title="Asl faylni ochish"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50" ref={contentRef}>
          {documentText ? (
            <div 
              className="prose prose-slate max-w-none font-serif text-slate-800 leading-relaxed text-sm md:text-base bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm"
              dangerouslySetInnerHTML={{ __html: formattedHtml }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">Matn topilmadi</h3>
              <p className="text-slate-500 max-w-md">
                Ushbu hujjatning to'liq matni bazada saqlanmagan (ehtimol, u yangilanishdan oldin yuklangan yoki u rasm formatida).
              </p>
              <button 
                onClick={() => window.open(`/api/document/${sessionId}`, '_blank')}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors"
              >
                <Download className="w-5 h-5" /> Asl faylni yuklab olish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
