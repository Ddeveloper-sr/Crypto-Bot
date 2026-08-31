function formatUsd(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Unavailable';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 8 : 2
  }).format(value);
}

function formatPercent(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    : 'Unavailable';
}

function formatCompact(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Unavailable';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

module.exports = { formatUsd, formatPercent, formatCompact };
