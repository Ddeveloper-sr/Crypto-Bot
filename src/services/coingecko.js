const BASE_URL = 'https://api.coingecko.com/api/v3';

async function request(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: process.env.CRYPTO_API_KEY ? { 'x-cg-demo-api-key': process.env.CRYPTO_API_KEY } : {}
  });
  if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);
  return response.json();
}

module.exports = {
  price: (ids, vs = 'usd') => request('/simple/price', { ids, vs_currencies: vs, include_24hr_change: 'true', include_market_cap: 'true', include_24hr_vol: 'true' }),
  coin: id => request(`/coins/${encodeURIComponent(id)}`, { localization: 'false', tickers: 'false', market_data: 'true', community_data: 'false', developer_data: 'false' }),
  markets: (vs = 'usd', page = 1, perPage = 10) => request('/coins/markets', { vs_currency: vs, order: 'market_cap_desc', per_page: perPage, page, sparkline: 'false', price_change_percentage: '24h' }),
  trending: () => request('/search/trending'),
  search: query => request('/search', { query }),
  global: () => request('/global')
};
