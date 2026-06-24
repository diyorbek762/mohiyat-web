"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { validateFile, formatFileSize, ALLOWED_EXTENSIONS } from "@/lib/utils";

interface FileUploadDropzoneProps {
  onFileAccepted: (file: File) => void;
  isProcessing: boolean;
  processingProgress: number;
}

export function FileUploadDropzone({ onFileAccepted, isProcessing, processingProgress }: FileUploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const err = validateFile(file);
    if (err) { setError(err); setSelectedFile(null); return; }
    setSelectedFile(file);
    onFileAccepted(file);
  }, [onFileAccepted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragActive(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragActive(false); }, []);
  const handleClick = () => { if (!isProcessing) inputRef.current?.click(); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const clearFile = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedFile(null); setError(null); };

  return (
    <div className="w-full max-w-2xl mx-auto" id="upload-dropzone">
      <div
        className={`dropzone ${isDragActive ? "active" : ""} ${isProcessing ? "processing" : ""}`}
        onClick={handleClick} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
        role="button" tabIndex={0} aria-label="Shartnoma faylini yuklash"
      >
        <input ref={inputRef} type="file" className="hidden" accept={ALLOWED_EXTENSIONS.join(",")} onChange={handleInputChange} id="file-upload-input" />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-5 animate-fade-in">
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(37,99,235,0.08)", border: "2px solid rgba(37,99,235,0.2)" }}>
                <Loader2 className="w-10 h-10 text-[var(--navy-400)] animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[var(--navy-500)] text-white text-[11px] font-bold flex items-center justify-center shadow-lg">
                {Math.round(processingProgress)}%
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-[var(--foreground)]">Shartnoma tahlil qilinmoqda...</p>
              <p className="text-sm text-[var(--foreground-muted)] mt-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--gold-500)]" />
                AI xavfli bandlarni aniqlayapti
              </p>
            </div>
            <div className="w-full max-w-sm progress-bar"><div className="fill" style={{ width: `${processingProgress}%` }} /></div>
          </div>
        ) : selectedFile && !error ? (
          <div className="flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(37,99,235,0.05))", border: "1px solid rgba(37,99,235,0.15)" }}>
              <FileText className="w-7 h-7 text-[var(--navy-500)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate max-w-[280px]">{selectedFile.name}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{formatFileSize(selectedFile.size)}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
              <span className="text-xs font-semibold text-[var(--success)]">Tahlil boshlandi</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all"
                 style={{
                   background: isDragActive ? "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.08))" : "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.03))",
                   border: `1px solid ${isDragActive ? "rgba(37,99,235,0.3)" : "rgba(37,99,235,0.1)"}`,
                   boxShadow: isDragActive ? "0 0 30px rgba(37,99,235,0.15)" : "none",
                 }}>
              <Upload className={`w-8 h-8 transition-all ${isDragActive ? "text-[var(--navy-400)] scale-110" : "text-[var(--navy-500)]"}`} />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-[var(--foreground)]">
                {isDragActive ? "Faylni shu yerga tashlang" : "Shartnomani yuklang"}
              </p>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">PDF, DOCX yoki rasm formatida · max 10MB</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
              {["PDF", "DOCX", "JPG", "PNG"].map((fmt) => (
                <span key={fmt} className="px-2.5 py-1 rounded-md font-mono font-medium" style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)" }}>
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 px-5 py-4 rounded-xl animate-scale-in" style={{ background: "var(--danger-light)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <AlertTriangle className="w-5 h-5 text-[var(--danger)] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[var(--danger)] flex-1 font-medium">{error}</p>
          <button onClick={clearFile} className="flex-shrink-0 p-1 rounded-md hover:bg-red-100 transition" id="clear-error-btn"><X className="w-4 h-4 text-[var(--danger)]" /></button>
        </div>
      )}

      <div className="text-center mt-5 flex items-center justify-center gap-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <svg className="w-3 h-3 text-[var(--success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
        <span className="text-xs text-[var(--foreground-muted)] font-medium">Faylingiz tahlildan so&apos;ng darhol va abadiy o&apos;chiriladi</span>
      </div>
    </div>
  );
}
