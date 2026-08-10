const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  tipoSolicitacao: { type: String, required: true },
  assunto: { type: String, required: true },
  mensagem: { type: String, required: true },
  currentUrl: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

supportTicketSchema.index({ doctor_id: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
