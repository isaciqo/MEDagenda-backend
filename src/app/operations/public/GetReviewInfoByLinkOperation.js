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

    // V01: verificar expiração do link
    if (appointment.reviewLinkExpires && appointment.reviewLinkExpires < new Date()) {
      const error = new Error('Link de avaliação expirado');
      error.statusCode = 400;
      throw error;
    }

    // P06: se já avaliado, retornar 200 com flag em vez de 409
    const existing = await this.reviewRepository.findByLinkId(reviewLinkId);
    if (existing) {
      return {
        alreadyReviewed: true,
        appointmentId: appointment.appointment_id,
        patientName: appointment.patient.name,
        date: appointment.date,
        time: appointment.time,
      };
    }

    return {
      alreadyReviewed: false,
      appointmentId: appointment.appointment_id,
      patientName: appointment.patient.name,
      date: appointment.date,
      time: appointment.time,
    };
  }
}

module.exports = GetReviewInfoByLinkOperation;
