const mongoose = require('mongoose');

const processedStripeEventSchema = new mongoose.Schema({
  eventId:     { type: String, required: true, unique: true },
  type:        { type: String, default: null },
  payload:     { type: mongoose.Schema.Types.Mixed, default: null },
  processedAt: { type: Date,   default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('ProcessedStripeEvent', processedStripeEventSchema);
