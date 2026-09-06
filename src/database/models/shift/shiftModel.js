const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shift_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  locationId: { type: String, default: null },
  // Snapshot do nome/cor do local no momento da criação — o médico pode
  // renomear ou trocar a cor do local depois, e o histórico do plantão não
  // deve mudar retroativamente (mesmo raciocínio do paymentMethod snapshot em
  // Appointment).
  locationName: { type: String, required: true },
  locationColor: { type: String, default: null },
  date: { type: String, required: true },   // início, YYYY-MM-DD
  time: { type: String, required: true },   // início, HH:mm
  endDate: { type: String, required: true }, // fim — pode ser vários dias depois de `date`
  endTime: { type: String, required: true },
  estimatedValue: { type: Number, required: true },
  paidValue: { type: Number, default: null },
  netValue: { type: Number, default: null },
  paymentMethod: { type: String, default: null },
  paymentDate: { type: String, default: null },
  // Sem 'confirmado'/'aguardando_confirmacao' — não existe paciente pra
  // confirmar presença num plantão.
  status: {
    type: String,
    enum: ['agendado', 'realizado', 'cancelado'],
    default: 'agendado',
  },
  notes: { type: String, default: '' },
  seriesId: { type: String, default: null, index: true },
  seriesIndex: { type: Number, default: null },
  seriesTotalSessions: { type: Number, default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

// TTL: mesmo padrão do Appointment.
shiftSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hot path: toda listagem/financeiro filtra por doctor_id (+ date/range).
shiftSchema.index({ doctor_id: 1, date: 1 });

// Necessário pro filtro de "plantão que começou antes do início da janela
// visível mas ainda não terminou" (ver ShiftRepository) — sem esse índice,
// essa cláusula do $or faria scan de doctor_id inteiro.
shiftSchema.index({ doctor_id: 1, endDate: 1 });

module.exports = mongoose.model('Shift', shiftSchema);
