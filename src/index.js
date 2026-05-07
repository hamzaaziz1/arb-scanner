const { fetchAllPrices } = require('./scanner');
const { findOpportunities } = require('./arbitrage');
const CONFIG = require('./config');

async function main() {
  console.log('Cross-Chain DEX Arbitrage Scanner');
  console.log('=================================\n');
  console.log('Fetching prices across chains...\n');

  // Fetch live prices from the DexPaprika API
  const prices = await fetchAllPrices();

  // Exit early if no data came back
  if (prices.length === 0) {
    console.error('No price data received. Check your network connection.');
    process.exit(1);
  }

  console.log(`Received ${prices.length} price points.\n`);

  // Find arbitrage opportunities and filter by minimum spread
  const opportunities = findOpportunities(prices);
  const filtered = opportunities.filter(
    (opp) => opp.spreadPercent >= CONFIG.minSpreadPercent
  );

  if (filtered.length === 0) {
    console.log('No arbitrage opportunities found above the minimum spread threshold.');
    console.log(`Current threshold: ${CONFIG.minSpreadPercent}%`);
  } else {
    console.log(`Found ${filtered.length} opportunities (min spread: ${CONFIG.minSpreadPercent}%):\n`);

    // Print a formatted table header
    console.log(
      'Token'.padEnd(8) +
      'Buy Chain'.padEnd(12) +
      'Sell Chain'.padEnd(12) +
      'Buy Price'.padEnd(14) +
      'Sell Price'.padEnd(14) +
      'Spread'
    );
    console.log('-'.repeat(70));

    // Print each opportunity as a table row
    for (const opp of filtered) {
      console.log(
        opp.symbol.padEnd(8) +
        opp.buyChain.padEnd(12) +
        opp.sellChain.padEnd(12) +
        `$${opp.buyPrice.toFixed(4)}`.padEnd(14) +
        `$${opp.sellPrice.toFixed(4)}`.padEnd(14) +
        `${opp.spreadPercent.toFixed(4)}%`
      );
    }
  }

  console.log('\nScan complete.');
}

// Run the scanner and handle any fatal errors
main().catch((error) => {
  console.error('Scanner failed:', error.message);
  process.exit(1);
});