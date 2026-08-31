/**
 * Application emoji sync scaffold.
 *
 * Put source PNG assets in assets/emojis/ and map their filenames below.
 * The implementation will be completed alongside the final emoji pack so
 * uploads/updates can be handled consistently for the Discord application.
 */

const fs = require('node:fs');
const path = require('node:path');

const emojiDirectory = path.join(__dirname, '..', 'assets', 'emojis');
fs.mkdirSync(emojiDirectory, { recursive: true });

const assets = fs.readdirSync(emojiDirectory)
  .filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file));

console.log(`Found ${assets.length} emoji asset(s).`);
console.log(assets.length ? assets.join('\n') : 'Add emoji images to assets/emojis/ first.');
