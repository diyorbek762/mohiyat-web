import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import ws from 'ws';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use Service Role Key for bypassing RLS on inserts
const googleApiKey = process.env.GOOGLE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !googleApiKey) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  realtime: {
    // @ts-ignore
    transport: ws
  }
});
const genAI = new GoogleGenerativeAI(googleApiKey);

// Configure the embedding model
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { role: 'user', parts: [{ text }] },
    outputDimensionality: 768
  } as any);
  return result.embedding.values;
}

// Function to chunk the codex text
// This assumes the codex is formatted where each article starts with a number and "-modda"
// Example: "104-modda. Xodimning holatini yomonlashtiruvchi shartlar..."
function chunkCodex(rawText: string): { articleNum: string, content: string }[] {
  const chunks: { articleNum: string, content: string }[] = [];
  
  // Split by Modda headers using regex. 
  // Looks for lines starting with numbers followed by "-modda" or just "modda"
  const regex = /(?=\n\s*\d+\s*-\s*modda\.?)/i;
  const rawChunks = rawText.split(regex);

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    
    // Extract the article number
    const match = trimmed.match(/^(\d+\s*-\s*modda\.?)/i);
    const articleNum = match ? match[1].trim() : "Noma'lum modda";
    
    if (trimmed.length > 20000) {
      console.warn(`Skipping chunk in article ${articleNum} as it is too large (${trimmed.length} chars)`);
      continue;
    }
    
    chunks.push({
      articleNum: articleNum,
      content: trimmed
    });
  }
  
  return chunks;
}

async function ingestCodex(filePath: string, codexName: string) {
  console.log(`Starting ingestion for ${codexName} from ${filePath}`);
  
  const text = fs.readFileSync(filePath, 'utf-8');
  const chunks = chunkCodex(text);
  
  console.log(`Extracted ${chunks.length} articles from the document.`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Processing [${i+1}/${chunks.length}]: ${chunk.articleNum}`);

    try {
      // 1. Generate Embedding
      const embedding = await generateEmbedding(chunk.content);
      
      // 2. Insert into Supabase
      const { error } = await supabase
        .from('legal_codex_vectors')
        .insert({
          codex_name: codexName,
          article_num: chunk.articleNum,
          content: chunk.content,
          embedding: embedding
        });

      if (error) {
        console.error(`Failed to insert ${chunk.articleNum}:`, error);
      }
      
      // Small delay to avoid hitting API rate limits (15 requests per minute)
      await new Promise(resolve => setTimeout(resolve, 4000));
      
    } catch (err) {
      console.error(`Error processing ${chunk.articleNum}:`, err);
    }
  }
  
  console.log("Ingestion Complete!");
}

// Entry Point
const targetFile = process.argv[2];
const codexName = process.argv[3];

if (!targetFile || !codexName) {
  console.log("Usage: npx ts-node scripts/ingest_codex.ts <path-to-txt-file> <codex-name>");
  console.log("Example: npx ts-node scripts/ingest_codex.ts data/mehnat_kodeksi_2023.txt 'Mehnat Kodeksi 2023'");
  process.exit(1);
}

ingestCodex(targetFile, codexName);
