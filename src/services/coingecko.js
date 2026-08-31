const { TTLCache } = require('./cache');

const BASE_URL = 'https://api.coingecko.com/api/v3';
const cache = new TTLCache(Number(process.env.API_CACHE_TTL_MS) || 30_000);

async function request(path, params = {}, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const cacheKey = url.toString();
  if (!options.noCache) {
    const cached = cache.get(cacheKey);
    if (cached !== undefined) return cached;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.API_TIMEOUT_MS) || 10_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: process.env.CRYPTO_API_KEY ? { 'x-cg-demo-api-key': process.env.CRYPTO_API_KEY } : {}
    });
    if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);
    const data = await response.json();
    return options.noCache ? data : cache.set(cacheKey, data);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  price: (ids, vs = 'usd') => request('/simple/price', { ids, vs_currencies: vs, include_24hr_change: 'true', include_market_cap: 'true', include_24hr_vol: 'true' }),
  coin: id => request(`/coins/${encodeURIComponent(id)}`, { localization: 'false', tickers: 'false', market_data: 'true', community_data: 'false', developer_data: 'false', sparkline: 'true' }),
  markets: (vs = 'usd', page = 1, perPage = 10) => request('/coins/markets', { vs_currency: vs, order: 'market_cap_desc', per_page: perPage, page, sparkline: 'false', price_change_percentage: '24h' }),
  trending: () => request('/search/trending'),
  search: query => request('/search', { query }),
  global: () => request('/global'),
  clearCache: () => cache.clear()
};
