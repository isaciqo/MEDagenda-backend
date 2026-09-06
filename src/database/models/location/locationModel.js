const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  location_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, default: '' },
  // Id de uma cor da paleta curada (ver src/lib/plantaoColors.js) — só usado
  // visualmente no contexto de plantão. Local de consulta presencial que nunca
  // participou de um plantão fica sem cor, e tudo bem.
  color: { type: String, default: null },
  // Duração padrão de um plantão nesse local, em minutos. Reescrita a cada
  // plantão criado apontando pra cá — serve só pra pré-preencher o horário de
  // fim no formulário. Null = nunca criou plantão nesse local.
  defaultShiftDurationMinutes: { type: Number, default: null },
}, { timestamps: true });

locationSchema.index({ doctor_id: 1, name: 1 });

module.exports = mongoose.model('Location', locationSchema);
