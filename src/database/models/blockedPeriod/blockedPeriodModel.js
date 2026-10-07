const mongoose = require('mongoose');

// Bloqueio de agenda pontual (ex: "sábado 20/09, o dia inteiro" ou "terça
// 14h-16h") — diferente do `schedule` semanal recorrente do User. Afeta só a
// disponibilidade mostrada pra quem NÃO é o próprio médico (página pública de
// agendamento e pedido de remarcação); a criação manual de consulta/plantão
// pelo médico continua livre, de propósito (é uma decisão dele, não do robô).
const blockedPeriodSchema = new mongoose.Schema({
  blocked_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  date: { type: String, required: true },
  allDay: { type: Boolean, default: true },
  startTime: { type: String, default: null },
  endTime: { type: String, default: null },
  reason: { type: String, default: '' },
}, { timestamps: true });

blockedPeriodSchema.index({ doctor_id: 1, date: 1 });

module.exports = mongoose.model('BlockedPeriod', blockedPeriodSchema);
