<div align="center">

# 🪙 Crypto Bot

**A modular Discord crypto information bot built with Node.js, discord.js, Components V2, and SQLite.**

[![Discord.js](https://img.shields.io/badge/discord.js-14.27.0-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

## Features

- 🪙 Cryptocurrency prices and market information
- 📈 Market statistics and chart-ready data
- 🔎 Coin search and discovery
- 🔥 Trending cryptocurrencies
- 🌍 Global market statistics
- ⚖️ Cryptocurrency comparison
- 💱 Currency conversion
- 💼 Simulated portfolio tracking
- 🔔 Price-alert system
- 🎛️ Discord Components V2 interfaces
- 🧩 Application-owned emoji support
- 📝 Centralized logging with `logger.js`
- 🗃️ SQLite persistence
- 🧱 Modular command, event, component, service, and database architecture

> **Notice:** This project is designed for market information and simulated/paper portfolio features. It does not provide real-money trading, custody, deposits, withdrawals, or exchange-account automation.

## Commands

| Command | Purpose |
| --- | --- |
| `/price` | View a cryptocurrency price |
| `/coin` | View detailed coin information |
| `/market` | View market data |
| `/markets` | Browse market listings |
| `/trending` | View trending assets |
| `/search` | Search for cryptocurrencies |
| `/global` | View global market statistics |
| `/compare` | Compare cryptocurrencies |
| `/convert` | Convert an amount between supported currencies |
| `/portfolio` | Manage a simulated portfolio |
| `/alert` | Manage price alerts |
| `/help` | Open the Components V2 help interface |
| `/about` | View bot information |
| `/ping` | Check bot latency |

## Project Structure

```text
Crypto-Bot/
├── src/
│   ├── commands/
│   │   ├── crypto/
│   │   ├── market/
│   │   ├── portfolio/
│   │   ├── alerts/
│   │   ├── utility/
│   │   └── admin/
│   ├── components/
│   │   ├── buttons/
│   │   ├── selects/
│   │   └── modals/
│   ├── events/
│   ├── handlers/
│   ├── services/
│   ├── database/
│   ├── config/
│   └── utils/
├── assets/
│   ├── emojis/
│   └── images/
├── scripts/
│   └── sync-emojis.js
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

- Node.js 18 or newer
- A Discord application and bot token
- A crypto market-data API key when required by the selected API plan
- A persistent filesystem if SQLite data should survive restarts

## Installation

```bash
npm install
cp .env.example .env
npm start
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
```

`GUILD_ID` is optional and can be used for development command registration.

## Hosting

The bot is a **long-lived Node.js process**. Choose a host that can keep a worker/service running continuously and, if using SQLite, provide persistent storage.

### Hosting choices

| Hosting | Best for | Recommendation |
| --- | --- | --- |
| **VPS** | Full control and predictable 24/7 operation | ⭐ Best for a serious self-hosted deployment |
| **Railway** | Fast GitHub deployment and managed infrastructure | ⭐ Best for the easiest deployment |
| **Render** | GitHub-connected Node.js services/background workers | Good option; choose a suitable paid worker/service plan for continuous operation |
| **Docker host** | Portable production deployments | Good if you already use Docker |

**Recommended path:** develop locally → deploy from GitHub to **Railway** or a **VPS** → add persistent storage → configure secrets → run the bot continuously.

Railway currently offers a $0 Free plan with limited included usage, while its Hobby plan has a $5 monthly minimum. Render provides Node.js services and background workers, with compute plans that include a free web-service tier but paid background-worker plans. Check each provider's current pricing before choosing a 24/7 setup. citeturn0search1turn0search0turn0search2

### Render

Use a Node.js service/background worker and configure:

```text
Build Command: npm ci
Start Command: npm start
```

Set the environment variables from `.env.example` in the host's secret/environment-variable settings. If SQLite is used in production, attach persistent storage and point `DATABASE_PATH` at that persistent location.

### Railway

Connect the GitHub repository, set the environment variables, and use:

```text
npm start
```

If SQLite is used, configure persistent storage/volume support so the database is not lost when the service is recreated.

### VPS

A VPS gives the most control. A typical production setup is:

```text
GitHub → VPS → Node.js → Crypto Bot
                    ├── SQLite
                    ├── logs/
                    └── PM2/systemd
```

Use a process manager and backups rather than relying on an SSH session staying open.

## Application Emojis

The bot is designed to use **application-owned emojis**. Keep the source assets in:

```text
assets/emojis/
```

Then use `scripts/sync-emojis.js` to synchronize the assets with the Discord application.

Suggested assets:

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

The UI uses Discord Components V2 for interactive panels, including buttons, select menus, modals, containers, sections, and text displays.

The project keeps component construction separate from command logic so the same UI patterns can be reused across crypto pages, portfolio screens, alerts, and help menus.

## Logging

`logger.js` provides a single logging interface for the application:

```js
logger.info('Bot started');
logger.success('Connected to Discord');
logger.warn('API rate limit approaching');
logger.error(error);
logger.debug('Debug information');
```

Logs can be written to the console and persistent log files depending on the runtime configuration.

## Data Sources

The crypto service layer is intentionally separated from commands. This makes it possible to change the market-data provider without rewriting the Discord command layer.

Market data should always be treated as informational and may be delayed, unavailable, or subject to API limits.

## Development

```bash
npm run dev
npm run deploy:commands
```

Before pushing changes:

```bash
npm test
```

## Security

- Never expose `DISCORD_TOKEN`.
- Never commit `.env`.
- Never store exchange passwords or private keys in this project.
- Validate user input before making API requests.
- Apply API and Discord rate limits.
- Keep database backups separate from source control.

## License

This project is released under the **MIT License**. See [LICENSE](LICENSE) for the complete license text.

## Disclaimer

Crypto-Bot provides software and market-information functionality only. Nothing produced by the bot is financial advice, an offer, or a recommendation to buy or sell an asset. Market data can be inaccurate or delayed. Use the project for development, education, and simulated portfolio functionality.

<div align="center">

**Built independently for Discord communities and developers.**

</div>
