const disposableDomains = require('disposable-email-domains');

// Set pra lookup O(1) — a lista tem ~120k domínios, não dá pra fazer .includes() a
// cada registro sem custo perceptível.
const DISPOSABLE_DOMAINS = new Set(disposableDomains);

function isDisposableEmail(email) {
  const domain = String(email).split('@')[1]?.toLowerCase();
  return !!domain && DISPOSABLE_DOMAINS.has(domain);
}

module.exports = { isDisposableEmail };
