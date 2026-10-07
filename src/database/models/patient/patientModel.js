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
  // Opcional, string 'YYYY-MM-DD' igual outras datas do app (nunca Date, pra
  // evitar problema de timezone com data sem horário).
  birthDate: { type: String, default: null },
  // Preenchidos só quando o cadastro foi feito por um representante (ver link
  // público de autocadastro) — nome de quem preencheu em nome do paciente, e
  // o parentesco/relação (mãe, pai, tutor...). Null nos outros casos.
  guardianName: { type: String, default: null },
  guardianRelationship: { type: String, default: null },
  // Registro de consentimento LGPD do formulário público — só existe quando
  // `source` é 'self_registration' (cadastro feito pelo médico não passa por
  // esse formulário, então não tem esse consentimento pra registrar).
  consentAcceptedAt: { type: Date, default: null },
  // 'manual' = médico cadastrou (via Agenda ou tela de Clientes). 'self_registration'
  // = veio do link público de autocadastro. 'public_booking' = veio de um
  // pedido pela página pública de agendamento (ver RequestPublicBookingOperation).
  // Usado só pra mostrar uma etiqueta discreta na lista de Clientes, não muda
  // nenhum comportamento.
  source: { type: String, enum: ['manual', 'self_registration', 'public_booking'], default: 'manual' },
}, { timestamps: true });

patientSchema.index({ doctor_id: 1, name: 1 });

module.exports = mongoose.model('Patient', patientSchema);
