// Utilidades pra comparar intervalos de data+hora que podem cruzar um ou mais
// dias (plantão) — ScheduleService hoje só compara horários dentro da MESMA
// data, não serve pra isso.

function daysBetween(dateA, dateB) {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Converte um par (data, hora) num único número comparável: dias desde uma
// época arbitrária × 1440 + minutos do dia. Dois pares assim já dão pra
// subtrair/comparar direto, não importa a distância entre eles.
function toAbsoluteMinutes(date, time) {
  const d = new Date(date + 'T00:00:00');
  const days = Math.round(d.getTime() / (24 * 60 * 60 * 1000));
  const [h, m] = time.split(':').map(Number);
  return days * 1440 + h * 60 + m;
}

// Checagem clássica de overlap de intervalos [aStart,aEnd) x [bStart,bEnd).
function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

module.exports = { daysBetween, addDays, toAbsoluteMinutes, intervalsOverlap };
