const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patient_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  name: { type: String, required: true },
  // Opcional — cliente sem telefone é uma escolha explícita do médico (ver
  // checkbox "Não tenho o telefone desse cliente" na Agenda). '' quando não
  // informado. Automações por WhatsApp (lembrete, confirmação, avaliação)
  // simplesmente não ficam disponíveis pra esse cliente.
  phone: { type: String, default: '' },
  displayName: { type: String, required: true },
}, { timestamps: true });

patientSchema.index({ doctor_id: 1, name: 1 });

module.exports = mongoose.model('Patient', patientSchema);
