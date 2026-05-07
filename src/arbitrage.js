// Groups prices by token and finds the best buy/sell chains
function findOpportunities(prices) {
  const grouped = {};

  // Group all price points by their token symbol
  for (const price of prices) {
    if (!grouped[price.tokenSymbol]) {
      grouped[price.tokenSymbol] = [];
    }
    grouped[price.tokenSymbol].push(price);
  }

  const opportunities = [];

  // For each token, compare prices across chains
  for (const [symbol, chainPrices] of Object.entries(grouped)) {
    // Need at least 2 chains to compare
    if (chainPrices.length < 2) continue;

    let lowest = chainPrices[0];
    let highest = chainPrices[0];

    // Find the cheapest and most expensive chain
    for (const cp of chainPrices) {
      if (cp.priceUsd < lowest.priceUsd) lowest = cp;
      if (cp.priceUsd > highest.priceUsd) highest = cp;
    }

    // Skip if the same chain has both lowest and highest
    if (lowest.network === highest.network) continue;

    // Calculate the percentage spread between chains
    const spread = ((highest.priceUsd - lowest.priceUsd) / lowest.priceUsd) * 100;

    opportunities.push({
      symbol,
      buyChain: lowest.network,
      sellChain: highest.network,
      buyPrice: lowest.priceUsd,
      sellPrice: highest.priceUsd,
      spreadPercent: spread,
    });
  }

  // Sort by highest spread first (best opportunities on top)
  opportunities.sort((a, b) => b.spreadPercent - a.spreadPercent);

  return opportunities;
}

module.exports = { findOpportunities };