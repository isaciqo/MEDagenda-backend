const { v4: uuidv4 } = require('uuid');

class SubmitReviewByLinkOperation {
  constructor({ appointmentRepository, reviewRepository }) {
    this.appointmentRepository = appointmentRepository;
    this.reviewRepository = reviewRepository;
  }

  async execute(reviewLinkId, { patientName, rating, comment }) {
    const appointment = await this.appointmentRepository.findByReviewLinkId(reviewLinkId);
    if (!appointment) {
      const error = new Error('Link inválido ou expirado');
      error.statusCode = 400;
      throw error;
    }

    const existing = await this.reviewRepository.findByLinkId(reviewLinkId);
    if (existing) {
      const error = new Error('Você já enviou um feedback para esta consulta');
      error.statusCode = 409;
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];
    const review = await this.reviewRepository.create({
      review_id: uuidv4(),
      doctor_id: appointment.doctor_id,
      appointment_id: appointment.appointment_id,
      reviewLinkId,
      patientName: patientName || null,
      rating,
      comment,
      date: today,
    });

    return {
      id: review.review_id,
      patientName: review.patientName,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
    };
  }
}

module.exports = SubmitReviewByLinkOperation;
