async function test() {
  try {
    const res = await fetch('https://mohiyat.vercel.app/api/lex-ingest/process-single', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-internal-secret': '' 
      },
      body: JSON.stringify({ lexId: "111189" })
    });
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch(e) {
    console.error(e);
  }
}
test();
