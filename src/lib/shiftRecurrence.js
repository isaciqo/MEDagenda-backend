// Motor de recorrência de plantão. Mesmo espírito do generateSeriesDates()
// privado em CreateAppointmentSeriesOperation.js, mas promovido a módulo
// próprio (não fica escondido num arquivo só) porque cobre 3 padrões
// diferentes, incluindo dois que não existem pra consulta (dias fixos do mês,
// a cada N dias).
//
// recurrence =
//   | { type: 'weekly' | 'biweekly' | 'monthly' }
//   | { type: 'fixedDaysOfMonth', days: number[] }   // ex: [5, 15, 25]
//   | { type: 'everyNDays', n: number }               // ex: n=6

// Teto universal — protege contra `everyNDays` com n=1 (ou uma janela mal
// calculada) gerando uma quantidade absurda de documentos numa chamada só.
// Mesmo espírito dos outros tetos de segurança do projeto (ver
// ANALISE_ABUSO_CUSTO.md, AppointmentRepository.findAll .limit(2000), etc.).
const MAX_OCCURRENCES = 60;

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function generateFixedStep(startDate, stepDays, windowMonths) {
  const dates = [];
  const start = new Date(startDate + 'T00:00:00');
  const windowEnd = addMonths(start, windowMonths);

  const current = new Date(start);
  while (current <= windowEnd && dates.length < MAX_OCCURRENCES) {
    dates.push(toDateStr(current));
    current.setDate(current.getDate() + stepDays);
  }
  return dates;
}

function generateMonthly(startDate, windowMonths) {
  const dates = [];
  const start = new Date(startDate + 'T00:00:00');
  const windowEnd = addMonths(start, windowMonths);

  const current = new Date(start);
  while (current <= windowEnd && dates.length < MAX_OCCURRENCES) {
    dates.push(toDateStr(current));
    current.setMonth(current.getMonth() + 1);
  }
  return dates;
}

// Janela maior (3 meses) que os outros padrões — uma escala fixa é
// naturalmente mais esparsa por mês, médico costuma planejar um trimestre.
// Dia que não existe no mês (ex: 31 em abril) é PULADO, nunca rolado pro
// próximo mês — rolar seria uma surpresa (virar dia 1 de maio sem avisar).
function generateFixedDaysOfMonth(startDate, days) {
  const dates = [];
  const start = new Date(startDate + 'T00:00:00');
  const windowEnd = addMonths(start, 3);
  const sortedDays = [...days].sort((a, b) => a - b);

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= windowEnd && dates.length < MAX_OCCURRENCES) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (const day of sortedDays) {
      if (dates.length >= MAX_OCCURRENCES) break;
      if (day > daysInMonth) continue; // pula — não rola pro mês seguinte
      const candidate = new Date(year, month, day);
      if (candidate < start || candidate > windowEnd) continue;
      dates.push(toDateStr(candidate));
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates;
}

function generateShiftSeriesDates({ startDate, recurrence }) {
  switch (recurrence.type) {
    case 'weekly':
      return generateFixedStep(startDate, 7, 2);
    case 'biweekly':
      return generateFixedStep(startDate, 14, 2);
    case 'monthly':
      return generateMonthly(startDate, 2);
    case 'fixedDaysOfMonth':
      return generateFixedDaysOfMonth(startDate, recurrence.days);
    case 'everyNDays':
      return generateFixedStep(startDate, recurrence.n, 2);
    default: {
      const error = new Error(`Padrão de recorrência desconhecido: ${recurrence.type}`);
      error.statusCode = 400;
      throw error;
    }
  }
}

module.exports = { generateShiftSeriesDates, MAX_OCCURRENCES };
