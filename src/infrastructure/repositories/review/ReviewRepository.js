const Review = require('../../../database/models/review/reviewModel');

class ReviewRepository {
  async findAll(doctor_id) {
    return Review.find({ doctor_id }).sort({ date: -1 });
  }

  async findByAppointmentId(appointment_id) {
    return Review.findOne({ appointment_id });
  }

  async findByLinkId(reviewLinkId) {
    return Review.findOne({ reviewLinkId });
  }

  async create(data) {
    const review = new Review(data);
    return review.save();
  }
}

module.exports = ReviewRepository;
