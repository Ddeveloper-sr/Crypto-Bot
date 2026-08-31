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

module.exports = {
  addHolding(userId, coinId, amount) {
    db.prepare(`INSERT INTO portfolios(user_id, coin_id, amount, updated_at) VALUES(?,?,?,?)
      ON CONFLICT(user_id, coin_id) DO UPDATE SET amount = amount + excluded.amount, updated_at = excluded.updated_at`)
      .run(userId, coinId, amount, Date.now());
  },
  removeHolding(userId, coinId, amount) {
    db.prepare('UPDATE portfolios SET amount = MAX(0, amount - ?), updated_at = ? WHERE user_id = ? AND coin_id = ?')
      .run(amount, Date.now(), userId, coinId);
  },
  getPortfolio(userId) {
    return db.prepare('SELECT coin_id, amount, updated_at FROM portfolios WHERE user_id = ? AND amount > 0 ORDER BY coin_id').all(userId);
  },
  resetPortfolio(userId) {
    db.prepare('DELETE FROM portfolios WHERE user_id = ?').run(userId);
  },
  createAlert(userId, coinId, direction, target) {
    return db.prepare('INSERT INTO alerts(user_id, coin_id, direction, target, created_at) VALUES(?,?,?,?,?)')
      .run(userId, coinId, direction, target, Date.now()).lastInsertRowid;
  },
  getAlerts(userId) {
    return db.prepare('SELECT * FROM alerts WHERE user_id = ? AND triggered_at IS NULL ORDER BY id DESC').all(userId);
  },
  deleteAlert(userId, id) {
    return db.prepare('DELETE FROM alerts WHERE user_id = ? AND id = ?').run(userId, id).changes > 0;
  },
  dueAlerts() {
    return db.prepare('SELECT * FROM alerts WHERE triggered_at IS NULL').all();
  },
  triggerAlert(id) {
    db.prepare('UPDATE alerts SET triggered_at = ? WHERE id = ?').run(Date.now(), id);
  }
};
