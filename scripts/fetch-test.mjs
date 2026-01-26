const fetch = require('node-fetch');

fetch('https://example.com')
  .then(res => res.text())
  .then(() => console.log('Legacy 16 fetch OK'));
