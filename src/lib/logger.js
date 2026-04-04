const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '../../logs');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');
const COMBINED_LOG = path.join(LOG_DIR, 'combined.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function write(level, message, meta = {}) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });

  fs.appendFileSync(COMBINED_LOG, entry + '\n');
  if (level === 'error' || level === 'warn') {
    fs.appendFileSync(ERROR_LOG, entry + '\n');
  }

  const color = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m' }[level] || '';
  console[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log'](
    `${color}[MEDagenda][${level.toUpperCase()}]\x1b[0m ${message}`,
    Object.keys(meta).length ? meta : ''
  );
}

const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};

module.exports = logger;
