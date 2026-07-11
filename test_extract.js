import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

const systemPrompt = `Siz huquqiy tahlilchi AIsiz. Foydalanuvchi hujjat yukladi.
Vazifangiz: 
1. Hujjat turini aniqlash. Agar qarz, kredit bo'lsa "kredit_yoki_qarz".
2. Agar hujjat "kredit_yoki_qarz" bo'lsa, "questions" ga 3 ta savol yozing.
QOIDALAR: FAQAT JSON.
{
  "domain": "kredit_yoki_qarz|boshqa",
  "questions": ["Savol?"]
}
Shartnoma matni:
KREDIT SHARTNOMASI
50 mln so'm qarz olinadi.`;

async function run() {
  try {
    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.0-flash-lite-preview-02-05:free",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt }],
    });
    console.log("Response:", response.choices[0].message.content);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
