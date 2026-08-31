require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const emojiDirectory = path.join(__dirname, '..', 'assets', 'emojis');
fs.mkdirSync(emojiDirectory, { recursive: true });

function emojiName(filename) {
  return path.basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 32);
}

async function main() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    throw new Error('DISCORD_TOKEN and CLIENT_ID are required.');
  }

  const assets = fs.readdirSync(emojiDirectory)
    .filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file));

  if (!assets.length) {
    console.log('No PNG/JPEG/GIF emoji assets found in assets/emojis/.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const existing = await rest.get(Routes.applicationEmojis(process.env.CLIENT_ID));
  const existingByName = new Map(existing.items.map(emoji => [emoji.name, emoji]));

  for (const filename of assets) {
    const name = emojiName(filename);
    const mime = filename.toLowerCase().endsWith('.gif') ? 'image/gif' : 'image/png';
    const image = `data:${mime};base64,${fs.readFileSync(path.join(emojiDirectory, filename)).toString('base64')}`;
    const current = existingByName.get(name);

    if (current) {
      await rest.patch(Routes.applicationEmoji(process.env.CLIENT_ID, current.id), {
        body: { name, image }
      });
      console.log(`Updated application emoji: ${name}`);
    } else {
      await rest.post(Routes.applicationEmojis(process.env.CLIENT_ID), {
        body: { name, image }
      });
      console.log(`Created application emoji: ${name}`);
    }
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
