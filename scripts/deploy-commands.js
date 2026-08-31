require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check the bot latency.'),
  new SlashCommandBuilder().setName('help').setDescription('Open the Crypto Bot help panel.'),
  new SlashCommandBuilder()
    .setName('price')
    .setDescription('View the current price of a cryptocurrency.')
    .addStringOption(option =>
      option.setName('coin').setDescription('CoinGecko coin ID.').setRequired(true)
    )
].map(command => command.toJSON());

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  throw new Error('DISCORD_TOKEN and CLIENT_ID are required.');
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);

  await rest.put(route, { body: commands });
  console.log(`Registered ${commands.length} commands.`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
