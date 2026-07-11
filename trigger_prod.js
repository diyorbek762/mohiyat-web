fetch('https://mohiyat.vercel.app/api/lex-ingest/trigger-mass', {
  method: 'POST',
  headers: {
    'x-internal-secret': ''
  }
}).then(res => res.json()).then(console.log).catch(console.error);
