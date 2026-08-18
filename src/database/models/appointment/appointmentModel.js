const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointment_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  patient: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  type: { type: String, enum: ['presencial', 'online'], required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  estimatedValue: { type: Number, required: true },
  paidValue: { type: Number, default: null },
  // Valor pago menos a taxa da forma de pagamento configurada em Settings no
  // momento em que a consulta foi realizada — snapshot, não recalcula se a
  // taxa mudar depois (evita reescrever histórico financeiro retroativamente).
  netValue: { type: Number, default: null },
  paymentMethod: {
    type: String,
    enum: ['pix', 'cartao', 'dinheiro', 'convenio'],
    default: null,
  },
  paymentDate: { type: String, default: null },
  status: {
    type: String,
    enum: ['agendado', 'confirmado', 'realizado', 'cancelado', 'aguardando_confirmacao'],
    default: 'agendado',
  },
  notes: { type: String, default: '' },
  location: { type: String, default: '' },
  meetingLink: { type: String, default: null },
  // Solicitação de remarcação feita pelo paciente pelo link de confirmação. Fica pendente
  // até o médico aceitar (aplica date/time) ou recusar — nunca aplicada automaticamente.
  rescheduleRequest: {
    pending: { type: Boolean, default: false },
    requestedDate: { type: String, default: null },
    requestedTime: { type: String, default: null },
    requestedAt: { type: Date, default: null },
  },
  activeReviewLinkId: { type: String, default: null },
  reviewLinkExpires: { type: Date, default: null },
  rescheduleCount: { type: Number, default: 0 },
  confirmToken: { type: String, default: null },
  confirmTokenExpires: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  isReturn: { type: Boolean, default: false },
  returnOf: { type: String, default: null },
  seriesId: { type: String, default: null, index: true },
  seriesIndex: { type: Number, default: null },
  seriesTotalSessions: { type: Number, default: null },
}, { timestamps: true });

// TTL: MongoDB deleta automaticamente quando expiresAt <= now
appointmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Toda query autenticada filtra por doctor_id (e a maioria também por date/range) —
// sem esse índice composto, CADA chamada a /appointments, /dashboard/stats e
// /financial/summary faz um collection scan na coleção INTEIRA (todos os médicos),
// não só nos documentos daquele médico. Sem rate limit nessas rotas, isso é o maior
// multiplicador de custo de CPU/IO do Mongo que existe no sistema hoje.
appointmentSchema.index({ doctor_id: 1, date: 1 });

// findByPatientId (cascade de delete, export LGPD, e agora a tela de detalhe do
// cliente) filtra só por 'patient.id' — já é seletivo o bastante sozinho, pois
// patient_id é um UUID global único (não precisa compor com doctor_id).
appointmentSchema.index({ 'patient.id': 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
