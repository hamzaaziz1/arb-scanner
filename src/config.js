const CONFIG = {
  // DexPaprika API base URL - no API key required
  apiBaseUrl: 'https://api.dexpaprika.com',
  // Minimum price spread percentage to flag as an opportunity
  minSpreadPercent: 0.01,
  // Tokens to track with their contract addresses on each chain
  tokens: [
    {
      symbol: 'WETH',
      addresses: {
        ethereum: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        arbitrum: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        polygon: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
      },
    },
    {
      symbol: 'USDC',
      addresses: {
        ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        bsc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        polygon: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        arbitrum: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      },
    },
    {
      symbol: 'USDT',
      addresses: {
        ethereum: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        bsc: '0x55d398326f99059ff775485246999027b3197955',
        polygon: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        arbitrum: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      },
    },
  ],
};

module.exports = CONFIG;