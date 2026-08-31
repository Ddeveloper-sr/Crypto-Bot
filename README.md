<div align="center">

# 🪙 Crypto Bot

**A modular Discord crypto information bot built with Node.js, discord.js, Components V2, and SQLite.**

[![Discord.js](https://img.shields.io/badge/discord.js-14.27.0-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.17%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

## Features

- 🪙 Cryptocurrency prices and market information
- 📈 7-day compact price charts
- 📊 Market listings with pagination
- 🔎 Coin search and discovery
- 🔥 Trending cryptocurrencies
- 🌍 Global market statistics
- ⚖️ Cryptocurrency comparison
- 💱 Currency conversion
- 💼 Simulated portfolio tracking
- 🧾 Portfolio history
- 🔔 Price-alert system with DM notifications
- 🎛️ Discord Components V2 interfaces
- 🧩 Application-owned emoji synchronization
- 📝 Centralized logging with `logger.js`
- 🗃️ SQLite persistence with WAL mode
- ⚡ Short-lived market-data caching
- 🧪 Automated tests and GitHub Actions CI

> **Notice:** This project provides market information and simulated/paper portfolio features. It does not provide real-money trading, custody, deposits, withdrawals, private-key storage, or exchange-account automation.

## Commands

| Command | Purpose |
| --- | --- |
| `/price` | View a cryptocurrency price |
| `/coin` | View detailed coin information |
| `/chart` | View a compact 7-day price chart |
| `/market` | View paginated market data |
| `/markets` | Browse market listings |
| `/trending` | View trending assets |
| `/search` | Search for cryptocurrencies |
| `/global` | View global market statistics |
| `/compare` | Compare cryptocurrencies |
| `/convert` | Convert an amount between supported currencies |
| `/portfolio view` | View simulated holdings |
| `/portfolio add` | Add a simulated holding |
| `/portfolio remove` | Remove a simulated holding |
| `/portfolio history` | View simulated portfolio history |
| `/portfolio reset` | Reset the simulated portfolio |
| `/alert create` | Create a price alert |
| `/alert list` | List active alerts |
| `/alert delete` | Delete an alert |
| `/alert clear` | Clear all active alerts |
| `/help` | Open the interactive Components V2 help interface |
| `/about` | View bot information |
| `/ping` | Check bot latency |

## Project Structure

```text
Crypto-Bot/
├── src/
│   ├── database/
│   │   └── database.js
│   ├── services/
│   │   ├── alert-worker.js
│   │   ├── cache.js
│   │   └── coingecko.js
│   ├── ui/
│   │   └── panels.js
│   └── utils/
│       └── format.js
├── assets/
│   ├── emojis/
│   └── images/
├── scripts/
│   ├── deploy-commands.js
│   └── sync-emojis.js
├── test/
│   └── core.test.js
├── .github/
│   └── workflows/
│       └── ci.yml
├── data/
├── logs/
├── index.js
├── logger.js
├── package.json
├── .env.example
├── .gitignore
├── Dockerfile
├── LICENSE
└── README.md
```

## Requirements

- Node.js **24.17.0 or newer**
- A Discord application and bot token
- `CLIENT_ID` from the Discord Developer Portal
- A CoinGecko API key when required by the selected API plan
- Persistent storage if SQLite data should survive host recreation

Current discord.js documentation requires Node.js 24.17.0 or newer for the current release line.

## Installation

```bash
npm install
cp .env.example .env
npm run deploy:commands
npm start
```

For local development:

```bash
npm run dev
```

Never commit `.env`, bot tokens, API keys, or generated database files.

## Environment Variables

```env
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
CRYPTO_API_KEY=
DATABASE_PATH=./data/crypto.db
LOG_LEVEL=info
API_CACHE_TTL_MS=30000
API_TIMEOUT_MS=10000
```

`GUILD_ID` is optional. When present, commands are registered to that development guild for faster updates. Without it, commands are registered globally.

## Hosting

Crypto-Bot is a **long-lived Node.js process**. Choose a host that can keep a worker/service running continuously and, if using SQLite, provide persistent storage.

### Hosting choices

| Hosting | Best for | Recommendation |
| --- | --- | --- |
| **VPS** | Full control, PM2/systemd, Docker, backups | ⭐ Best for serious self-hosting |
| **Railway** | Fast GitHub deployment | ⭐ Easiest managed deployment |
| **Render** | GitHub-connected Node.js services/workers | Good managed option |
| **Docker host** | Portable production deployments | Good if you already use Docker |

**Recommended path:** develop locally → deploy from GitHub to Railway or a VPS → configure secrets → attach persistent storage → run the bot continuously.

### VPS

```text
GitHub → VPS → Node.js → Crypto Bot
                    ├── SQLite
                    ├── logs/
                    └── PM2/systemd
```

Use a process manager such as PM2 or systemd. Do not rely on an SSH session staying open.

### Railway / Render

Use the host's Node.js service/worker configuration:

```text
Install: npm install
Start:   npm start
```

Configure every variable from `.env.example` as a secret/environment variable. If SQLite is used in production, configure persistent storage and set `DATABASE_PATH` to that persistent location.

Always check the provider's current pricing, sleep behavior, storage rules, and worker limits before selecting a 24/7 deployment.

## Application Emojis

The bot supports **application-owned emojis**. Put PNG, JPEG, or GIF source files in:

```text
assets/emojis/
```

Then run:

```bash
npm run sync:emojis
```

The synchronization script creates or updates application emojis using the filenames as emoji names.

Suggested pack:

```text
crypto.png
bitcoin.png
ethereum.png
market.png
chart.png
portfolio.png
alert.png
search.png
settings.png
refresh.png
back.png
next.png
help.png
```

## Components V2

The bot uses Discord Components V2 for its interactive UI. The implementation uses containers, text displays, separators, buttons, and select menus instead of relying on a traditional embed-only interface.

The `/help` interface includes category navigation, while market and coin panels expose refresh/pagination controls.

## Logging

`logger.js` provides one logging interface across the application:

```js
logger.info('Bot started');
logger.success('Connected to Discord');
logger.warn('API rate limit approaching');
logger.error(error);
logger.debug('Debug information');
```

Keep secrets out of logs. Production log files should be rotated or handled by the hosting platform.

## Data Sources

The service layer is separated from Discord command logic so the market-data provider can be changed without rewriting the bot UI.

Market data may be delayed, unavailable, rate-limited, or changed by the provider. The bot treats it as informational data.

## Testing

Run the test suite with:

```bash
npm test
```

GitHub Actions also runs the test suite on pushes and pull requests targeting `main`.

## Security

- Never expose `DISCORD_TOKEN`.
- Never commit `.env`.
- Never store exchange passwords or private keys in this project.
- Validate user input before making API requests.
- Respect Discord and market-data API rate limits.
- Keep SQLite backups separate from source control.
- Use a host secret manager/environment variables for production credentials.

## License

This project is released under the **MIT License**. See [LICENSE](LICENSE) for the complete license text.

## Disclaimer

Crypto-Bot is software for market-information and simulated portfolio functionality. Nothing produced by the bot is financial advice, an offer, or a recommendation to buy or sell an asset. Market data can be inaccurate or delayed.

<div align="center">

**Built independently for Discord communities and developers.**

</div>
