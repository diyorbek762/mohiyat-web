import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Map severity to display color class
 */
export function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "high":
      return "badge-high";
    case "medium":
      return "badge-medium";
    case "low":
      return "badge-low";
    default:
      return "badge-medium";
  }
}

/**
 * Map severity to localized Uzbek label
 */
export function severityLabel(severity: string): string {
  switch (severity.toLowerCase()) {
    case "high":
      return "Yuqori";
    case "medium":
      return "O'rta";
    case "low":
      return "Past";
    default:
      return severity;
  }
}

/**
 * Get risk score color based on value
 */
export function riskScoreColor(score: number): string {
  if (score >= 70) return "var(--danger)";
  if (score >= 40) return "var(--warning)";
  return "var(--success)";
}

/**
 * Allowed file extensions for upload
 */
export const ALLOWED_EXTENSIONS = [".pdf"];
export const MAX_FILE_SIZE_MB = 4;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validate uploaded file
 */
export function validateFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const tgExtensions = [".png", ".jpg", ".jpeg", ".docx", ".doc", ".xlsx", ".txt"];
    if (tgExtensions.includes(ext)) {
      return "TG_BOT_REDIRECT";
    }
    return `Fayl turi qo'llab-quvvatlanmaydi: ${ext}. Faqat PDF formatida yuklang.`;
  }
  
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Fayl hajmi ${MAX_FILE_SIZE_MB}MB dan oshmasligi kerak. Hozirgi: ${formatFileSize(file.size)}`;
  }
  return null;
}
