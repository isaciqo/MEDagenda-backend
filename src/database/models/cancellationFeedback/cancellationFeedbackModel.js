const mongoose = require('mongoose');
const { CANCELLATION_REASON_IDS } = require('../../../lib/cancellationReasons');

const cancellationFeedbackSchema = new mongoose.Schema({
  feedback_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  // Snapshot do momento do cancelamento — a conta pode mudar de nome/e-mail
  // depois, ou ser apagada, e o feedback deve continuar legível.
  name: { type: String, required: true },
  email: { type: String, required: true },
  plan: { type: String, required: true },
  canceledAt: { type: Date, required: true },
  emailSentAt: { type: Date, default: null },
  reasonCategory: { type: String, enum: CANCELLATION_REASON_IDS, default: null },
  comment: { type: String, default: '' },
  respondedAt: { type: Date, default: null },
}, { timestamps: true });

cancellationFeedbackSchema.index({ doctor_id: 1 });

module.exports = mongoose.model('CancellationFeedback', cancellationFeedbackSchema);
