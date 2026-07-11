async function test() {
  const payload = {
    message: {
      chat: { id: 123456 },
      text: "/start"
    }
  };
  try {
    const res = await fetch('https://mohiyat.vercel.app/api/webhook/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch(e) {
    console.error(e);
  }
}
test();
