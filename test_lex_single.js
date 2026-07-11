fetch('http://localhost:3000/api/lex-ingest/process-single', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-internal-secret': ''
  },
  body: JSON.stringify({ lexId: "111189" }) // Fuqarolik kodeksi
}).then(res => res.json()).then(console.log).catch(console.error);
