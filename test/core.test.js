const test = require('node:test');
const assert = require('node:assert/strict');
const { formatUsd, formatPercent, formatCompact } = require('../src/utils/format');
const { TTLCache } = require('../src/services/cache');

test('formatUsd formats valid USD values', () => {
  assert.equal(formatUsd(1234.5), '$1,234.50');
});

test('formatPercent includes a sign', () => {
  assert.equal(formatPercent(2.5), '+2.50%');
  assert.equal(formatPercent(-2.5), '-2.50%');
});

test('formatCompact handles market-sized values', () => {
  assert.equal(formatCompact(1500000), '1.5M');
});

test('TTLCache stores and expires values', async () => {
  const cache = new TTLCache(10);
  cache.set('key', 'value');
  assert.equal(cache.get('key'), 'value');
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(cache.get('key'), undefined);
});
