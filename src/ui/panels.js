const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const { formatUsd, formatPercent, formatCompact } = require('../utils/format');

function v2Reply(components) {
  return { components, flags: 1 << 15 };
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
  const panel = textPanel('🪙 Crypto Bot',
    '**Market**\n`/price` `/coin` `/market` `/markets` `/trending` `/search` `/global` `/compare` `/convert`\n\n' +
    '**Tools**\n`/portfolio` `/alert` `/about` `/ping`\n\n' +
    'Market data is informational. Portfolio features are simulated only.', [
      new ButtonBuilder().setCustomId('help_market').setLabel('Market').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('help_tools').setLabel('Tools').setStyle(ButtonStyle.Secondary)
    ]);
  panel.addSeparatorComponents(new SeparatorBuilder());
  panel.addActionRowComponents(row => row.addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('Choose a help category')
      .addOptions(
        { label: 'Market commands', value: 'market', description: 'Prices, markets, search, and comparisons' },
        { label: 'Portfolio commands', value: 'portfolio', description: 'Simulated holdings and history' },
        { label: 'Alert commands', value: 'alerts', description: 'Create and manage price alerts' },
        { label: 'Utility commands', value: 'utility', description: 'Help, about, and latency' }
      )
  ));
  return panel;
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
    `Rank: #${coin.market_cap_rank ?? '—'}\n` +
    `Circulating supply: ${formatCompact(market.circulating_supply)}`;
  return textPanel('🪙 Coin Details', body, [
    new ButtonBuilder().setCustomId(`coin_refresh:${coin.id}`).setLabel('Refresh').setStyle(ButtonStyle.Primary)
  ]);
}

module.exports = { v2Reply, textPanel, helpPanel, coinPanel, formatUsd, formatPercent };
