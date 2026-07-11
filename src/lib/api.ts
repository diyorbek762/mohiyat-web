import { supabase } from "@/lib/supabase";
import type { ScanResult } from "./supabase";

const API_BASE_URL = "/api";

/**
 * Upload a document file to the FastAPI backend for freemium analysis.
 * Returns the scan result with blind spots (hook) — no full report.
 */
export async function scanDocument(file: File, documentType: string, userId?: string, contextAnswers?: Record<number, string>, inCrm?: boolean): Promise<ScanResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);
  if (userId) {
    formData.append("user_id", userId);
  }
  if (contextAnswers && Object.keys(contextAnswers).length > 0) {
    // Format answers nicely
    const answersText = Object.entries(contextAnswers).map(([idx, ans]) => `Q${Number(idx)+1}: ${ans}`).join("\n");
    formData.append("context_answers", answersText);
  }
  if (inCrm) {
    formData.append("in_crm", "true");
  }

  // Get current session token for authenticated request
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: token ? {
      "Authorization": `Bearer ${token}`
    } : {},
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Serverga ulanib bo'lmadi";
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } catch (e) {
      // JSON parse failed, fallback to default
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error("Backend is not available");
  return response.json();
}
