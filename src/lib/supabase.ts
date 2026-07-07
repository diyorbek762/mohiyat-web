import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types ──────────────────────────────────────────────────────────────────

export interface BlindSpot {
  title: string;
  severity: "high" | "medium" | "low";
  section_ref: string;
  legal_basis?: string;
  recommendation?: string;
}

export interface ScanResult {
  session_id: string;
  blind_spots: BlindSpot[];
  risk_score: number;
  summary: string;
  page_count: number;
  processing_ms: number;
  model_used: string;
  is_scam?: boolean;
  scam_details?: string;
}

export interface FullReport {
  blind_spots: BlindSpot[];
  risk_score: number;
  detailed_analysis: {
    section: string;
    content_summary: string;
    risk_level: string;
    legal_reference: string;
    explanation: string;
    action_required: string;
  }[];
  overall_summary: string;
  recommendations: string[];
}

export interface SharedReport {
  session_id: string;
  file_name: string;
  detected_domain: string;
  blind_spots: BlindSpot[];
  risk_score: number;
  full_report: FullReport | null;
  created_at: string;
}
