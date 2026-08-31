require('dotenv').config();

const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags
} = require('discord.js');
const logger = require('./logger');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency.'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Open the Crypto Bot help panel.'),
  new SlashCommandBuilder()
    .setName('price')
    .setDescription('View the current price of a cryptocurrency.')
    .addStringOption(option =>
      option
        .setName('coin')
        .setDescription('CoinGecko coin ID, such as bitcoin or ethereum.')
        .setRequired(true)
    )
].map(command => command.toJSON());

const helpPanel = () => new ContainerBuilder()
  .addTextDisplayComponents(
    new TextDisplayBuilder().setContent('# 🪙 Crypto Bot\nMarket information, simulated portfolio tools, alerts, and interactive Components V2 interfaces.')
  )
  .addSeparatorComponents(new SeparatorBuilder())
  .addTextDisplayComponents(
    new TextDisplayBuilder().setContent('**Crypto**\n`/price` — current price\n`/coin` — detailed coin information\n`/market` — market statistics\n`/markets` — market listings\n`/trending` — trending assets\n`/search` — search coins\n`/global` — global market data\n`/compare` — compare assets\n`/convert` — currency conversion')
  )
  .addSeparatorComponents(new SeparatorBuilder())
  .addTextDisplayComponents(
    new TextDisplayBuilder().setContent('**Tools**\n`/portfolio` — simulated portfolio\n`/alert` — price alerts\n`/about` — bot information\n`/ping` — latency')
  );

async function fetchPrice(coin) {
  const url = new URL('https://api.coingecko.com/api/v3/simple/price');
  url.searchParams.set('ids', coin);
  url.searchParams.set('vs_currencies', 'usd');
  url.searchParams.set('include_24hr_change', 'true');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`CoinGecko returned HTTP ${response.status}`);

  const data = await response.json();
  return data[coin];
}

client.once('ready', async readyClient => {
  logger.success(`Logged in as ${readyClient.user.tag}`);

  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    logger.warn('DISCORD_TOKEN or CLIENT_ID is missing; command registration/login may fail.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      logger.success(`Registered ${commands.length} development commands.`);
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      logger.success(`Registered ${commands.length} global commands.`);
    }
  } catch (error) {
    logger.error(error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === 'ping') {
      await interaction.reply(`Pong! ${client.ws.ping}ms`);
      return;
    }

    if (interaction.commandName === 'help') {
      await interaction.reply({
        components: [helpPanel()],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    if (interaction.commandName === 'price') {
      const coin = interaction.options.getString('coin', true).toLowerCase();
      const data = await fetchPrice(coin);

      if (!data) {
        await interaction.reply({ content: `I couldn't find **${coin}**. Use a CoinGecko coin ID.` });
        return;
      }

      const price = data.usd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? 'Unavailable';
      const change = typeof data.usd_24h_change === 'number' ? `${data.usd_24h_change.toFixed(2)}%` : 'Unavailable';

      const panel = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# 🪙 ${coin}\n**Price:** ${price}\n**24h change:** ${change}`)
        );

      await interaction.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2
      });
    }
  } catch (error) {
    logger.error(error);

    const payload = { content: 'Something went wrong while processing that command.' };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

process.on('unhandledRejection', logger.error);
process.on('uncaughtException', logger.error);

if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN is not configured. Copy .env.example to .env and add your bot token.');
  process.exitCode = 1;
} else {
  client.login(process.env.DISCORD_TOKEN).catch(logger.error);
}
