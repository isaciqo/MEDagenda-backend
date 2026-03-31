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
  activeReviewLinkId: { type: String, default: null },
  isReturn: { type: Boolean, default: false },
  returnOf: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
