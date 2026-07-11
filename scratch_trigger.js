fetch('http://localhost:3000/api/lex-ingest/trigger-mass', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-internal-secret': ''
  }
}).then(res => res.json()).then(console.log).catch(console.error);
