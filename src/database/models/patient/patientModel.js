const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patient_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  displayName: { type: String, required: true },
  // Último local usado numa consulta presencial deste paciente — sobrescrito
  // toda vez que uma consulta presencial é criada/editada com um local novo,
  // pra pré-preencher automaticamente da próxima vez.
  lastLocation: { type: String, default: '' },
}, { timestamps: true });

patientSchema.index({ doctor_id: 1, name: 1 });

module.exports = mongoose.model('Patient', patientSchema);
