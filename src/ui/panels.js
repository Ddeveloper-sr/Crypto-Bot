const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  SectionBuilder,
  MessageFlags
} = require('discord.js');

function v2Reply(components) {
  return { components, flags: MessageFlags.IsComponentsV2 };
}

function textPanel(title, body, buttons = []) {
  const panel = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${title}\n${body}`));
  if (buttons.length) {
    panel.addSeparatorComponents(new SeparatorBuilder());
    panel.addActionRowComponents(row => row.addComponents(...buttons));
  }
  return panel;
}

function helpPanel() {
  return textPanel('🪙 Crypto Bot',
    '**Market**\n`/price` `/coin` `/market` `/markets` `/trending` `/search` `/global` `/compare` `/convert`\n\n' +
    '**Tools**\n`/portfolio` `/alert` `/about` `/ping`\n\n' +
    'Market data is informational. Portfolio features are simulated only.', [
      new ButtonBuilder().setCustomId('help_market').setLabel('Market').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('help_tools').setLabel('Tools').setStyle(ButtonStyle.Secondary)
    ]);
}

function coinPanel(coin, data) {
  const market = data.market_data || {};
  const price = market.current_price?.usd;
  const change = market.price_change_percentage_24h;
  const body = `**${coin.name} (${coin.symbol?.toUpperCase()})**\n` +
    `Price: ${formatUsd(price)}\n` +
    `24h: ${formatPercent(change)}\n` +
    `Market cap: ${formatUsd(market.market_cap?.usd)}\n` +
    `24h volume: ${formatUsd(market.total_volume?.usd)}\n` +
    `Rank: #${coin.market_cap_rank ?? '—'}`;
  return textPanel('🪙 Coin Details', body, [
    new ButtonBuilder().setCustomId(`coin_refresh:${coin.id}`).setLabel('Refresh').setStyle(ButtonStyle.Primary)
  ]);
}

function formatUsd(value) {
  if (typeof value !== 'number') return 'Unavailable';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value < 1 ? 6 : 2 }).format(value);
}
function formatPercent(value) {
  return typeof value === 'number' ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : 'Unavailable';
}

module.exports = { v2Reply, textPanel, helpPanel, coinPanel, formatUsd, formatPercent };
