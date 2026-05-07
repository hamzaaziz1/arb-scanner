// Entrypoint that routes to the correct mode
const mode = process.env.MODE || 'scan';

if (mode === 'stream') {
  require('./stream');
} else {
  require('./index');
}