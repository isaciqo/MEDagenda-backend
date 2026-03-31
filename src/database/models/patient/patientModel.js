const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patient_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  displayName: { type: String, required: true }, // ex: "Maria Silva" ou "Maria Silva (paciente 2)"
  notes: { type: String, default: '' },
}, { timestamps: true });

patientSchema.index({ doctor_id: 1, name: 1 });

module.exports = mongoose.model('Patient', patientSchema);
