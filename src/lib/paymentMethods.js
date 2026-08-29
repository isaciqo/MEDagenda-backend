// Pix e dinheiro viraram um único método (mesma taxa: geralmente zero, chegam
// na hora). O médico pode adicionar/editar/remover formas de pagamento livremente
// a partir daqui — não é mais uma lista fixa.
const DEFAULT_PAYMENT_METHODS = [
  { id: 'pix_dinheiro', label: 'Pix / Dinheiro', percentage: 0, fixed: 0 },
  { id: 'cartao_debito', label: 'Cartão de débito', percentage: 0, fixed: 0 },
  { id: 'cartao_credito', label: 'Cartão de crédito', percentage: 0, fixed: 0 },
  { id: 'convenio', label: 'Convênio', percentage: 0, fixed: 0 },
];

// Contas que configuraram taxa antes dessa mudança têm um Map fixo
// (pix/cartao_debito/cartao_credito/dinheiro/convenio) salvo em
// `paymentMethodFees` — converte pra lista dinâmica uma única vez, unindo
// pix + dinheiro (fica com a taxa que tiver valor, ou zero se as duas forem).
function migrateLegacyFees(legacyFees) {
  const obj = legacyFees instanceof Map ? Object.fromEntries(legacyFees) : legacyFees;
  if (!obj || Object.keys(obj).length === 0) return null;

  const pix = obj.pix;
  const dinheiro = obj.dinheiro;
  const pixDinheiro = (pix && (pix.percentage || pix.fixed)) ? pix : (dinheiro || pix || {});

  return [
    { id: 'pix_dinheiro', label: 'Pix / Dinheiro', percentage: pixDinheiro.percentage || 0, fixed: pixDinheiro.fixed || 0 },
    { id: 'cartao_debito', label: 'Cartão de débito', percentage: obj.cartao_debito?.percentage || 0, fixed: obj.cartao_debito?.fixed || 0 },
    { id: 'cartao_credito', label: 'Cartão de crédito', percentage: obj.cartao_credito?.percentage || 0, fixed: obj.cartao_credito?.fixed || 0 },
    { id: 'convenio', label: 'Convênio', percentage: obj.convenio?.percentage || 0, fixed: obj.convenio?.fixed || 0 },
  ];
}

// Única fonte de verdade pra resolver a lista de formas de pagamento de um
// médico: usa a lista dinâmica se já existir, migra o formato antigo se só
// isso existir, ou cai pro default de fábrica.
function resolvePaymentMethods(user) {
  if (Array.isArray(user?.paymentMethods) && user.paymentMethods.length > 0) {
    return user.paymentMethods.map(m => ({
      id: m.id, label: m.label, percentage: m.percentage || 0, fixed: m.fixed || 0,
    }));
  }
  return migrateLegacyFees(user?.paymentMethodFees) || DEFAULT_PAYMENT_METHODS;
}

module.exports = { DEFAULT_PAYMENT_METHODS, resolvePaymentMethods };
