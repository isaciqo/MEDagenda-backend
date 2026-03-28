class ListReviewsOperation {
  constructor({ reviewRepository }) {
    this.reviewRepository = reviewRepository;
  }

  async execute(doctor_id) {
    const reviews = await this.reviewRepository.findAll(doctor_id);
    return reviews.map(r => ({
      id: r.review_id,
      patientName: r.patientName,
      rating: r.rating,
      comment: r.comment,
      date: r.date,
      appointmentId: r.appointment_id,
    }));
  }
}

module.exports = ListReviewsOperation;
