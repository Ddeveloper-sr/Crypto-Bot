const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const location = process.env.DATABASE_PATH || './data/crypto.db';
fs.mkdirSync(path.dirname(path.resolve(location)), { recursive: true });
const db = new Database(location);

db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS portfolios (
  user_id TEXT NOT NULL,
  coin_id TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, coin_id)
);
CREATE TABLE IF NOT EXISTS portfolio_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  coin_id TEXT,
  amount REAL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  coin_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('above','below')),
  target REAL NOT NULL,
  created_at INTEGER NOT NULL,
  triggered_at INTEGER
);
`);

const now = () => Date.now();

module.exports = {
  addHolding(userId, coinId, amount) {
    db.prepare(`INSERT INTO portfolios(user_id, coin_id, amount, updated_at) VALUES(?,?,?,?)
      ON CONFLICT(user_id, coin_id) DO UPDATE SET amount = amount + excluded.amount, updated_at = excluded.updated_at`)
      .run(userId, coinId, amount, now());
    db.prepare('INSERT INTO portfolio_history(user_id, action, coin_id, amount, created_at) VALUES(?,?,?,?,?)')
      .run(userId, 'add', coinId, amount, now());
  },
  removeHolding(userId, coinId, amount) {
    const row = db.prepare('SELECT amount FROM portfolios WHERE user_id = ? AND coin_id = ?').get(userId, coinId);
    const removed = Math.min(amount, row?.amount || 0);
    db.prepare('UPDATE portfolios SET amount = MAX(0, amount - ?), updated_at = ? WHERE user_id = ? AND coin_id = ?')
      .run(amount, now(), userId, coinId);
    db.prepare('DELETE FROM portfolios WHERE user_id = ? AND coin_id = ? AND amount <= 0').run(userId, coinId);
    if (removed > 0) db.prepare('INSERT INTO portfolio_history(user_id, action, coin_id, amount, created_at) VALUES(?,?,?,?,?)')
      .run(userId, 'remove', coinId, removed, now());
    return removed;
  },
  getPortfolio(userId) {
    return db.prepare('SELECT coin_id, amount, updated_at FROM portfolios WHERE user_id = ? AND amount > 0 ORDER BY coin_id').all(userId);
  },
  getHistory(userId, limit = 20) {
    return db.prepare('SELECT * FROM portfolio_history WHERE user_id = ? ORDER BY id DESC LIMIT ?').all(userId, limit);
  },
  resetPortfolio(userId) {
    db.prepare('DELETE FROM portfolios WHERE user_id = ?').run(userId);
    db.prepare('INSERT INTO portfolio_history(user_id, action, created_at) VALUES(?,?,?)').run(userId, 'reset', now());
  },
  createAlert(userId, coinId, direction, target) {
    return db.prepare('INSERT INTO alerts(user_id, coin_id, direction, target, created_at) VALUES(?,?,?,?,?)')
      .run(userId, coinId, direction, target, now()).lastInsertRowid;
  },
  getAlerts(userId) {
    return db.prepare('SELECT * FROM alerts WHERE user_id = ? AND triggered_at IS NULL ORDER BY id DESC').all(userId);
  },
  deleteAlert(userId, id) {
    return db.prepare('DELETE FROM alerts WHERE user_id = ? AND id = ?').run(userId, id).changes > 0;
  },
  clearAlerts(userId) {
    return db.prepare('DELETE FROM alerts WHERE user_id = ? AND triggered_at IS NULL').run(userId).changes;
  },
  dueAlerts() {
    return db.prepare('SELECT * FROM alerts WHERE triggered_at IS NULL').all();
  },
  triggerAlert(id) {
    db.prepare('UPDATE alerts SET triggered_at = ? WHERE id = ?').run(now(), id);
  }
};
