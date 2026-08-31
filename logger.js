const fs = require('node:fs');
const path = require('node:path');

const logDirectory = path.join(__dirname, 'logs');
fs.mkdirSync(logDirectory, { recursive: true });

const level = process.env.LOG_LEVEL || 'info';
const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = levels[level] ?? levels.info;

function write(type, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

  if ((levels[type] ?? levels.info) >= threshold || type === 'error') {
    console.log(line);
  }

  const filename = type === 'error' ? 'errors.log' : 'bot.log';
  fs.appendFileSync(path.join(logDirectory, filename), `${line}\n`, 'utf8');
}

module.exports = {
  debug: (message) => write('debug', message),
  info: (message) => write('info', message),
  warn: (message) => write('warn', message),
  error: (error) => write('error', error instanceof Error ? error.stack : String(error)),
  success: (message) => write('info', `SUCCESS ${message}`)
};
