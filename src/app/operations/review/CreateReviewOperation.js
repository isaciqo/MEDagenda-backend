const { v4: uuidv4 } = require('uuid');

class CreateReviewOperation {
  constructor({ reviewRepository, appointmentRepository }) {
    this.reviewRepository = reviewRepository;
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ appointmentId, patientName, rating, comment }) {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    // P05: avaliação só permitida após realização
    if (appointment.status !== 'realizado') {
      const error = new Error('A avaliação só está disponível após a realização da consulta');
      error.statusCode = 400;
      throw error;
    }

    const existing = await this.reviewRepository.findByAppointmentId(appointmentId);
    if (existing) {
      const error = new Error('Avaliação já enviada para esta consulta');
      error.statusCode = 400;
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];
    const review = await this.reviewRepository.create({
      review_id: uuidv4(),
      doctor_id: appointment.doctor_id,
      appointment_id: appointmentId,
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
      appointmentId: review.appointment_id,
    };
  }
}

module.exports = CreateReviewOperation;
