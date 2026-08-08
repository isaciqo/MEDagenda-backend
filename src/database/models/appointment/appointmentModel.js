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
  calendarEventId: { type: String, default: null }, // uso interno — nunca expor na API
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

module.exports = mongoose.model('Appointment', appointmentSchema);
