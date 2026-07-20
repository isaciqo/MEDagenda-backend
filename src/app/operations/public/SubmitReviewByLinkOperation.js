const { v4: uuidv4 } = require('uuid');

class SubmitReviewByLinkOperation {
  constructor({ appointmentRepository, reviewRepository }) {
    this.appointmentRepository = appointmentRepository;
    this.reviewRepository = reviewRepository;
  }

  async execute(reviewLinkId, { rating, comment }) {
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

    // P05: só permite avaliar consultas realizadas
    if (appointment.status !== 'realizado') {
      const error = new Error('A avaliação só está disponível após a realização da consulta');
      error.statusCode = 400;
      throw error;
    }

    // V01: garante que o link só pode ser usado uma vez
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
      patientName: appointment.patient.name,
      rating,
      comment,
      date: today,
    });

    // V01: invalida o link após uso — impede múltiplas avaliações pelo mesmo link
    await this.appointmentRepository.update(appointment.appointment_id, {
      activeReviewLinkId: null,
      reviewLinkExpires: null,
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
