class GetReviewInfoByLinkOperation {
  constructor({ appointmentRepository, reviewRepository }) {
    this.appointmentRepository = appointmentRepository;
    this.reviewRepository = reviewRepository;
  }

  async execute(reviewLinkId) {
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

    return {
      appointmentId: appointment.appointment_id,
      patientName: appointment.patient.name,
      date: appointment.date,
      time: appointment.time,
    };
  }
}

module.exports = GetReviewInfoByLinkOperation;
