const CONFIG = require('./config');
const { findOpportunities } = require('./arbitrage');

// Alert threshold - only print when spread exceeds this percentage
const ALERT_THRESHOLD = parseFloat(process.env.ALERT_THRESHOLD || '0.01');

// In-memory price cache: { "WETH:ethereum": 2739.50, "WETH:arbitrum": 2741.12, ... }
const priceCache = {};

function updateCache(tokenSymbol, chain, price) {
  const key = `${tokenSymbol}:${chain}`;
  priceCache[key] = price;
}

function checkOpportunities(tokenSymbol) {
  // Build a prices array from the cache for this token
  const prices = [];
  for (const [key, price] of Object.entries(priceCache)) {
    const [symbol, network] = key.split(':');
    if (symbol === tokenSymbol) {
      prices.push({ tokenSymbol: symbol, network, priceUsd: price });
    }
  }

  if (prices.length < 2) return;

  const opportunities = findOpportunities(prices);
  const alerts = opportunities.filter((opp) => opp.spreadPercent >= ALERT_THRESHOLD);

  for (const alert of alerts) {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] ALERT: ${alert.symbol} | ` +
      `Buy on ${alert.buyChain} @ $${alert.buyPrice.toFixed(4)} | ` +
      `Sell on ${alert.sellChain} @ $${alert.sellPrice.toFixed(4)} | ` +
      `Spread: ${alert.spreadPercent.toFixed(4)}%`
    );
  }
}

async function connectStream(token, network, address) {
  const url = `https://streaming.dexpaprika.com/stream?method=t_p&chain=${network}&address=${address}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'text/event-stream' },
    });

    if (!response.ok) {
      console.warn(`Stream failed for ${token.symbol}/${network}: ${response.status}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log(`Connected: ${token.symbol} on ${network}`);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const price = parseFloat(data.p);
            if (!isNaN(price)) {
              updateCache(token.symbol, network, price);
              checkOpportunities(token.symbol);
            }
          } catch (e) {
            // Skip malformed events
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Connection error for ${token.symbol}/${network}: ${error.message}`);
  }
}

async function main() {
  console.log('Cross-Chain DEX Arbitrage Scanner - STREAMING MODE');
  console.log('===================================================\n');
  console.log(`Alert threshold: ${ALERT_THRESHOLD}%`);
  console.log('Connecting to price streams...\n');

  const connections = [];

  for (const token of CONFIG.tokens) {
    for (const [network, address] of Object.entries(token.addresses)) {
      connections.push(connectStream(token, network, address));
    }
  }

  await Promise.allSettled(connections);
  console.log('\nAll streams disconnected.');
}

main().catch((error) => {
  console.error('Streaming failed:', error.message);
  process.exit(1);
});