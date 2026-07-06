import { z } from "zod";

// 1. Scan Input Validation Schema
export const scanInputSchema = z.object({
  file: z.any()
    .refine((file) => file !== null && file !== undefined, "Fayl majburiy")
    .refine((file) => file?.size <= 10 * 1024 * 1024, "Fayl hajmi 10MB dan oshmasligi kerak"),
  document_type: z.string().optional().default("other"),
  user_id: z.string().uuid("Yaroqsiz user ID").optional().nullable(),
});

// 2. Chat Input Validation Schema
export const chatInputSchema = z.object({
  session_id: z.string().uuid("Yaroqsiz session ID"),
  message: z.string().min(1, "Xabar bo'sh bo'lishi mumkin emas").max(2000, "Xabar juda uzun (max 2000 belgi)"),
});

// 3. Counter-Offer Input Validation Schema
export const counterOfferInputSchema = z.object({
  session_id: z.string().uuid("Yaroqsiz session ID"),
  selected_risks: z.array(z.string()).min(1, "Kamida bitta xavf tanlanishi kerak"),
  tone: z.enum(["professional", "aggressive", "friendly"]).default("professional"),
  user_name: z.string().optional(),
});
