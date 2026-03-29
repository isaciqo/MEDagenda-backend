const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  appointment_id: { type: String, required: true },
  patientName: { type: String, default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: String, required: true },
  reviewLinkId: { type: String, default: null, sparse: true },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
