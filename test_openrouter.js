require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

const modelsToTest = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.0-pro-exp-02-05:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "google/gemma-2-9b-it:free",
  "nousresearch/hermes-3-llama-3.1-405b:free"
];

async function test() {
  for (const model of modelsToTest) {
    try {
      console.log(`Testing ${model}...`);
      const res = await openrouter.chat.completions.create({
        model,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10
      });
      console.log(`SUCCESS: ${model} -> ${res.choices[0].message.content}`);
    } catch (e) {
      console.log(`FAILED: ${model} -> ${e.message}`);
    }
  }
}

test();
