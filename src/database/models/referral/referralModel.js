const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer_id: { type: String, required: true, index: true },
  referred_id: { type: String, required: true, unique: true }, // unique = idempotency guarantee
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);
