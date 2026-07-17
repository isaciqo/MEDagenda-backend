function write(level, message, meta = {}) {
  const color = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m' }[level] || '';
  const reset = '\x1b[0m';
  const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const skip = new Set(['stack', 'details']);
  const parts = Object.entries(meta)
    .filter(([k]) => !skip.has(k))
    .map(([k, v]) => {
      if (v === null || v === undefined) return null;
      const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `${k}=${str}`;
    })
    .filter(Boolean);

  const metaStr = parts.length ? ' | ' + parts.join(' ') : '';

  console[method](`${color}[${level.toUpperCase()}]${reset} ${ts} ${message}${metaStr}`);

  if (level === 'error' && meta.stack) {
    console.error(meta.stack);
  }
}

const logger = {
  info: (message, meta = {}) => write('info', message, meta),
  warn: (message, meta = {}) => write('warn', message, meta),
  error: (message, meta = {}) => write('error', message, meta),
};

module.exports = logger;
