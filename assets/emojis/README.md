# Application Emoji Assets

Place the final PNG/JPEG/GIF emoji artwork in this directory.

## Recommended pack

- `crypto.png` — main bot/coin icon
- `bitcoin.png` — Bitcoin
- `ethereum.png` — Ethereum
- `market.png` — market data
- `chart.png` — chart/analytics
- `portfolio.png` — simulated portfolio
- `alert.png` — price alerts
- `search.png` — search
- `settings.png` — settings
- `refresh.png` — refresh
- `back.png` — previous/back
- `next.png` — next
- `help.png` — help

## Upload

After adding the images, run:

```bash
npm run sync:emojis
```

The script reads the filenames, normalizes them into Discord application-emoji names, and creates or updates the application's emojis.

Do not put secrets or credentials in this directory.
