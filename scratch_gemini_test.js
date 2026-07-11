require('dotenv').config({ path: '.env.local' });
async function test() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${process.env.GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'models/gemini-embedding-2', content: { parts: [{ text: "Hello" }] } })
  });
  if (!res.ok) {
    console.error("Gemini Error:", await res.text());
  } else {
    const data = await res.json();
    console.log("Gemini Success! Dimensions:", data.embedding?.values?.length);
  }
}
test();
