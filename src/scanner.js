const CONFIG = require('./config');

// Fetch the USD price of a single token on a specific network
async function fetchTokenPrice(network, tokenAddress) {
  const url = `${CONFIG.apiBaseUrl}/networks/${network}/tokens/${tokenAddress}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${network}/${tokenAddress}: ${response.status}`);
  }

  const data = await response.json();

  return {
    network,
    address: tokenAddress,
    priceUsd: parseFloat(data.summary?.price_usd) || null,
    symbol: data.symbol || 'UNKNOWN',
    liquidity: parseFloat(data.summary?.liquidity_usd) || 0,
  };
}

// Fetch prices for all configured tokens across all chains
async function fetchAllPrices() {
  const requests = [];

  for (const token of CONFIG.tokens) {
    for (const [network, address] of Object.entries(token.addresses)) {
      requests.push(
        fetchTokenPrice(network, address).then((result) => ({
          ...result,
          tokenSymbol: token.symbol,
        }))
      );
    }
  }

  const results = await Promise.allSettled(requests);

  const prices = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.priceUsd !== null) {
      prices.push(result.value);
    } else if (result.status === 'rejected') {
      console.warn(`Warning: ${result.reason.message}`);
    }
  }

  return prices;
}

module.exports = { fetchTokenPrice, fetchAllPrices };

