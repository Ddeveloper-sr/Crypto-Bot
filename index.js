require('dotenv').config();

const {
  Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
  ButtonBuilder, ButtonStyle
} = require('discord.js');
const logger = require('./logger');
const api = require('./src/services/coingecko');
const db = require('./src/database/database');
const { startAlertWorker } = require('./src/services/alert-worker');
const { v2Reply, helpPanel, coinPanel, textPanel, formatUsd, formatPercent } = require('./src/ui/panels');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency.'),
  new SlashCommandBuilder().setName('help').setDescription('Open the interactive help panel.'),
  new SlashCommandBuilder().setName('about').setDescription('View bot information.'),
  new SlashCommandBuilder().setName('price').setDescription('View a cryptocurrency price.')
    .addStringOption(o => o.setName('coin').setDescription('CoinGecko ID, e.g. bitcoin').setRequired(true)),
  new SlashCommandBuilder().setName('coin').setDescription('View detailed coin information.')
    .addStringOption(o => o.setName('coin').setDescription('CoinGecko ID').setRequired(true)),
  new SlashCommandBuilder().setName('chart').setDescription('View a 7-day price sparkline.')
    .addStringOption(o => o.setName('coin').setDescription('CoinGecko ID').setRequired(true)),
  new SlashCommandBuilder().setName('market').setDescription('View top market assets.')
    .addIntegerOption(o => o.setName('page').setDescription('Market page').setMinValue(1).setMaxValue(10)),
  new SlashCommandBuilder().setName('markets').setDescription('Browse market listings.')
    .addIntegerOption(o => o.setName('page').setDescription('Market page').setMinValue(1).setMaxValue(10)),
  new SlashCommandBuilder().setName('trending').setDescription('View trending cryptocurrencies.'),
  new SlashCommandBuilder().setName('search').setDescription('Search for cryptocurrencies.')
    .addStringOption(o => o.setName('query').setDescription('Search query').setRequired(true)),
  new SlashCommandBuilder().setName('global').setDescription('View global cryptocurrency statistics.'),
  new SlashCommandBuilder().setName('compare').setDescription('Compare two cryptocurrencies.')
    .addStringOption(o => o.setName('coin1').setDescription('First CoinGecko ID').setRequired(true))
    .addStringOption(o => o.setName('coin2').setDescription('Second CoinGecko ID').setRequired(true)),
  new SlashCommandBuilder().setName('convert').setDescription('Convert an amount using current market prices.')
    .addNumberOption(o => o.setName('amount').setDescription('Amount').setMinValue(0).setRequired(true))
    .addStringOption(o => o.setName('from').setDescription('CoinGecko ID').setRequired(true))
    .addStringOption(o => o.setName('to').setDescription('CoinGecko ID').setRequired(true)),
  new SlashCommandBuilder().setName('portfolio').setDescription('Manage your simulated portfolio.')
    .addSubcommand(s => s.setName('view').setDescription('View your simulated portfolio.'))
    .addSubcommand(s => s.setName('add').setDescription('Add a simulated holding.')
      .addStringOption(o => o.setName('coin').setDescription('CoinGecko ID').setRequired(true))
      .addNumberOption(o => o.setName('amount').setDescription('Amount of coins').setMinValue(0.00000001).setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a simulated holding.')
      .addStringOption(o => o.setName('coin').setDescription('CoinGecko ID').setRequired(true))
      .addNumberOption(o => o.setName('amount').setDescription('Amount of coins').setMinValue(0.00000001).setRequired(true)))
    .addSubcommand(s => s.setName('history').setDescription('View simulated portfolio history.'))
    .addSubcommand(s => s.setName('reset').setDescription('Reset your simulated portfolio.')),
  new SlashCommandBuilder().setName('alert').setDescription('Manage price alerts.')
    .addSubcommand(s => s.setName('create').setDescription('Create an alert.')
      .addStringOption(o => o.setName('coin').setDescription('CoinGecko ID').setRequired(true))
      .addStringOption(o => o.setName('direction').setDescription('Trigger direction').setRequired(true).addChoices({ name: 'Above', value: 'above' }, { name: 'Below', value: 'below' }))
      .addNumberOption(o => o.setName('price').setDescription('Target USD price').setMinValue(0).setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('List your alerts.'))
    .addSubcommand(s => s.setName('delete').setDescription('Delete an alert.')
      .addIntegerOption(o => o.setName('id').setDescription('Alert ID').setMinValue(1).setRequired(true)))
    .addSubcommand(s => s.setName('clear').setDescription('Delete all active alerts.'))
].map(c => c.toJSON());

function v2(title, body, buttons = []) {
  return v2Reply([textPanel(title, body, buttons)]);
}

function sparkline(values, width = 36) {
  if (!Array.isArray(values) || values.length < 2) return 'Unavailable';
  const chars = '▁▂▃▄▅▆▇█';
  const step = Math.max(1, Math.floor(values.length / width));
  const sampled = values.filter((_, i) => i % step === 0).slice(0, width);
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;
  return sampled.map(value => chars[Math.min(7, Math.floor(((value - min) / range) * 7))]).join('');
}

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);
  await rest.put(route, { body: commands });
  logger.success(`Registered ${commands.length} commands.`);
}

async function portfolioValue(userId) {
  const holdings = db.getPortfolio(userId);
  if (!holdings.length) return { holdings, total: 0 };
  const prices = await api.price(holdings.map(x => x.coin_id).join(','));
  let total = 0;
  for (const h of holdings) total += (prices[h.coin_id]?.usd || 0) * h.amount;
  return { holdings, total };
}

async function marketPanel(page = 1) {
  const safePage = Math.max(1, Math.min(10, page));
  const rows = await api.markets('usd', safePage, 10);
  const body = rows.map((x, n) => `**${(safePage - 1) * 10 + n + 1}. ${x.name} (${x.symbol.toUpperCase()})** — ${formatUsd(x.current_price)} · ${formatPercent(x.price_change_percentage_24h)}`).join('\n');
  return v2('📊 Market', body || 'No market data available.', [
    new ButtonBuilder().setCustomId(`market_page:${Math.max(1, safePage - 1)}`).setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(safePage <= 1),
    new ButtonBuilder().setCustomId(`market_page:${safePage + 1}`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(safePage >= 10)
  ]);
}

async function handleCommand(i) {
  const name = i.commandName;
  if (name === 'ping') return i.reply(v2('🏓 Pong', `Gateway latency: **${client.ws.ping}ms**`));
  if (name === 'help') return i.reply(v2Reply([helpPanel()]));
  if (name === 'about') return i.reply(v2('🪙 Crypto Bot', 'A modular Discord crypto information bot using discord.js, Components V2, CoinGecko market data, SQLite, application emojis, caching, and centralized logging.\n\n**Safety:** market data is informational and portfolio features are simulated only.'));

  if (name === 'price') {
    const coin = i.options.getString('coin', true).toLowerCase();
    const data = await api.price(coin);
    if (!data[coin]) return i.reply(v2('Not found', `No market data was found for **${coin}**.`));
    const d = data[coin];
    return i.reply(v2(`🪙 ${coin}`, `**Price:** ${formatUsd(d.usd)}\n**24h:** ${formatPercent(d.usd_24h_change)}\n**Market cap:** ${formatUsd(d.usd_market_cap)}\n**24h volume:** ${formatUsd(d.usd_24h_vol)}`, [new ButtonBuilder().setCustomId(`coin_refresh:${coin}`).setLabel('Refresh').setStyle(ButtonStyle.Primary)]));
  }

  if (name === 'coin') {
    const coin = i.options.getString('coin', true).toLowerCase();
    const data = await api.coin(coin);
    if (!data?.id) return i.reply(v2('Not found', `No coin was found for **${coin}**.`));
    return i.reply(v2Reply([coinPanel(data, data)]));
  }

  if (name === 'chart') {
    const coin = i.options.getString('coin', true).toLowerCase();
    const data = await api.coin(coin);
    const prices = data.market_data?.sparkline_7d?.price;
    const current = data.market_data?.current_price?.usd;
    return i.reply(v2('📈 7-Day Chart', `**${data.name || coin}**\n${sparkline(prices)}\n\nCurrent: **${formatUsd(current)}**\nChart is a compact text representation of CoinGecko's 7-day sparkline data.`));
  }

  if (name === 'market' || name === 'markets') return i.reply(await marketPanel(i.options.getInteger('page') || 1));

  if (name === 'trending') {
    const data = await api.trending();
    const coins = data.coins.slice(0, 10).map((x, n) => `**${n + 1}. ${x.item.name} (${x.item.symbol})** — rank #${x.item.market_cap_rank ?? '—'}`).join('\n');
    return i.reply(v2('🔥 Trending', coins || 'No trending data available.'));
  }

  if (name === 'search') {
    const q = i.options.getString('query', true);
    const data = await api.search(q);
    const results = data.coins.slice(0, 10).map(x => `**${x.name}** — \`${x.id}\` · ${x.symbol}`).join('\n');
    return i.reply(v2(`🔎 Search: ${q}`, results || 'No results found.'));
  }

  if (name === 'global') {
    const d = (await api.global()).data;
    return i.reply(v2('🌍 Global Market', `**Market cap:** ${formatUsd(d.total_market_cap.usd)}\n**24h volume:** ${formatUsd(d.total_volume.usd)}\n**BTC dominance:** ${d.market_cap_percentage.btc?.toFixed(2)}%\n**Active cryptocurrencies:** ${d.active_cryptocurrencies.toLocaleString()}`));
  }

  if (name === 'compare') {
    const a = i.options.getString('coin1', true).toLowerCase();
    const b = i.options.getString('coin2', true).toLowerCase();
    const data = await api.price(`${a},${b}`);
    if (!data[a] || !data[b]) return i.reply(v2('Compare', 'One or both coins could not be found.'));
    return i.reply(v2('⚖️ Compare', `**${a}** — ${formatUsd(data[a].usd)} · ${formatPercent(data[a].usd_24h_change)}\n**${b}** — ${formatUsd(data[b].usd)} · ${formatPercent(data[b].usd_24h_change)}`));
  }

  if (name === 'convert') {
    const amount = i.options.getNumber('amount', true);
    const from = i.options.getString('from', true).toLowerCase();
    const to = i.options.getString('to', true).toLowerCase();
    const data = await api.price(`${from},${to}`);
    if (!data[from] || !data[to]?.usd) return i.reply(v2('💱 Convert', 'One or both coins could not be found.'));
    const result = amount * data[from].usd / data[to].usd;
    return i.reply(v2('💱 Conversion', `**${amount} ${from}** ≈ **${result.toLocaleString('en-US', { maximumFractionDigits: 8 })} ${to}**\n\nBased on current market prices.`));
  }

  if (name === 'portfolio') {
    const sub = i.options.getSubcommand();
    if (sub === 'add' || sub === 'remove') {
      const coin = i.options.getString('coin', true).toLowerCase();
      const amount = i.options.getNumber('amount', true);
      const check = await api.price(coin);
      if (!check[coin]) return i.reply(v2('Portfolio', 'Unknown coin ID.'));
      if (sub === 'add') db.addHolding(i.user.id, coin, amount);
      else {
        const removed = db.removeHolding(i.user.id, coin, amount);
        if (!removed) return i.reply(v2('Portfolio', `You do not have a simulated **${coin}** holding to remove.`));
      }
      return i.reply(v2('💼 Portfolio', `${sub === 'add' ? 'Added' : 'Removed'} **${amount} ${coin}** in your simulated portfolio.`));
    }
    if (sub === 'reset') { db.resetPortfolio(i.user.id); return i.reply(v2('💼 Portfolio', 'Your simulated portfolio has been reset.')); }
    if (sub === 'history') {
      const history = db.getHistory(i.user.id);
      const body = history.length ? history.map(h => `**${h.action.toUpperCase()}** · ${h.coin_id || 'all'} · ${h.amount ?? ''}`).join('\n') : 'No portfolio history yet.';
      return i.reply(v2('🧾 Portfolio History', body));
    }
    const result = await portfolioValue(i.user.id);
    const body = result.holdings.length ? result.holdings.map(h => `**${h.coin_id}** — ${h.amount}`).join('\n') + `\n\n**Estimated value:** ${formatUsd(result.total)}` : 'Your simulated portfolio is empty.';
    return i.reply(v2('💼 Portfolio', body));
  }

  if (name === 'alert') {
    const sub = i.options.getSubcommand();
    if (sub === 'create') {
      const coin = i.options.getString('coin', true).toLowerCase();
      const direction = i.options.getString('direction', true);
      const price = i.options.getNumber('price', true);
      const check = await api.price(coin);
      if (!check[coin]) return i.reply(v2('🔔 Alert', 'Unknown coin ID.'));
      const id = db.createAlert(i.user.id, coin, direction, price);
      return i.reply(v2('🔔 Alert Created', `Alert **#${id}** will trigger when **${coin}** moves ${direction} **${formatUsd(price)}**.`));
    }
    if (sub === 'delete') {
      const id = i.options.getInteger('id', true);
      return i.reply(v2('🔔 Alert', db.deleteAlert(i.user.id, id) ? `Deleted alert **#${id}**.` : 'Alert not found.'));
    }
    if (sub === 'clear') return i.reply(v2('🔔 Alerts', `Cleared **${db.clearAlerts(i.user.id)}** active alert(s).`));
    const alerts = db.getAlerts(i.user.id);
    const body = alerts.length ? alerts.map(a => `**#${a.id}** · ${a.coin_id} · ${a.direction} ${formatUsd(a.target)}`).join('\n') : 'You have no active alerts.';
    return i.reply(v2('🔔 Alerts', body));
  }
}

client.once('ready', async ready => {
  logger.success(`Logged in as ${ready.user.tag}`);
  try {
    await registerCommands();
    startAlertWorker(client);
    logger.success('Price alert worker started.');
  } catch (error) { logger.error(error); }
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === 'help_market') return interaction.update(v2('📊 Market Commands', '`/price` `/coin` `/chart` `/market` `/markets` `/trending` `/search` `/global` `/compare` `/convert`'));
      if (interaction.customId === 'help_tools') return interaction.update(v2('🧰 Tool Commands', '`/portfolio view|add|remove|history|reset`\n`/alert create|list|delete|clear`\n`/about` `/ping`'));
      if (interaction.customId.startsWith('coin_refresh:')) {
        const coin = interaction.customId.split(':')[1];
        const data = await api.coin(coin);
        return interaction.update(v2Reply([coinPanel(data, data)]));
      }
      if (interaction.customId.startsWith('market_page:')) return interaction.update(await marketPanel(Number(interaction.customId.split(':')[1])));
      return;
    }
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_select') {
      const value = interaction.values[0];
      const panels = {
        market: v2('📊 Market', '`/price` `/coin` `/chart` `/market` `/markets` `/trending` `/search` `/global` `/compare` `/convert`'),
        portfolio: v2('💼 Portfolio', '`/portfolio view` `/portfolio add` `/portfolio remove` `/portfolio history` `/portfolio reset`\n\nAll portfolio actions are simulated.'),
        alerts: v2('🔔 Alerts', '`/alert create` `/alert list` `/alert delete` `/alert clear`'),
        utility: v2('🧰 Utility', '`/help` `/about` `/ping`')
      };
      return interaction.update(panels[value]);
    }
    if (!interaction.isChatInputCommand()) return;
    logger.info(`${interaction.user.tag} used /${interaction.commandName}`);
    await handleCommand(interaction);
  } catch (error) {
    logger.error(error);
    const payload = v2('Error', 'The request could not be completed. Please try again later.');
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
});

process.on('unhandledRejection', logger.error);
process.on('uncaughtException', logger.error);

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  logger.error('DISCORD_TOKEN and CLIENT_ID are required.');
  process.exitCode = 1;
} else {
  client.login(process.env.DISCORD_TOKEN).catch(logger.error);
}
