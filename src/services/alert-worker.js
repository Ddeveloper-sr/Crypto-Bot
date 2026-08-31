const api = require('./coingecko');
const db = require('../database/database');
const logger = require('../../logger');

async function checkAlerts(client) {
  const alerts = db.dueAlerts();
  if (!alerts.length) return;

  const ids = [...new Set(alerts.map(a => a.coin_id))];
  const prices = await api.price(ids.join(','));

  for (const alert of alerts) {
    const current = prices[alert.coin_id]?.usd;
    if (typeof current !== 'number') continue;

    const triggered = alert.direction === 'above'
      ? current >= alert.target
      : current <= alert.target;

    if (!triggered) continue;

    db.triggerAlert(alert.id);
    const user = await client.users.fetch(alert.user_id).catch(() => null);
    if (!user) continue;

    await user.send(`🔔 Crypto alert #${alert.id}: ${alert.coin_id} is ${alert.direction} ${alert.target} USD. Current price: ${current} USD.`).catch(error => logger.warn(`Could not DM alert #${alert.id}: ${error.message}`));
  }
}

function startAlertWorker(client, intervalMs = 60_000) {
  const timer = setInterval(() => checkAlerts(client).catch(logger.error), intervalMs);
  timer.unref?.();
  return timer;
}

module.exports = { checkAlerts, startAlertWorker };
