const mongoose = require('mongoose');

// Contato inicial de clínicas com vários profissionais interessadas num plano
// que ainda não existe no produto — só uma forma de capturar interesse e
// entrar em contato, não vira conta nem assinatura sozinho.
const clinicLeadSchema = new mongoose.Schema({
  leadId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  clinicName: { type: String, default: '' },
  professionalsCount: { type: String, default: '' },
  message: { type: String, required: true },
}, { timestamps: true });

clinicLeadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ClinicLead', clinicLeadSchema);
