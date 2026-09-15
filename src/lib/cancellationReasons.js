// Motivos fechados de cancelamento — mesmo espírito de plantaoColors.js:
// arquivo espelhado entre backend (validação) e frontend (rótulos), pra
// analisar respostas agregadas por categoria depois.
const CANCELLATION_REASONS = [
  { id: 'preco', label: 'Achei caro' },
  { id: 'nao_usei_suficiente', label: 'Não usei o suficiente' },
  { id: 'faltou_funcionalidade', label: 'Faltou uma funcionalidade que eu precisava' },
  { id: 'dificil_de_usar', label: 'Achei difícil de usar' },
  { id: 'troquei_de_ferramenta', label: 'Troquei por outra ferramenta' },
  { id: 'parei_de_atender', label: 'Parei de atender / mudei de área' },
  { id: 'outro', label: 'Outro motivo' },
];

const CANCELLATION_REASON_IDS = CANCELLATION_REASONS.map(r => r.id);

module.exports = { CANCELLATION_REASONS, CANCELLATION_REASON_IDS };
