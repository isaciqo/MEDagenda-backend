const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class GenerateAppointmentLinksOperation {
  constructor({ appointmentRepository, tokenService }) {
    this.appointmentRepository = appointmentRepository;
    this.tokenService = tokenService;
  }

  async execute(appointment_id, doctor_id) {
    const appointment = await this.appointmentRepository.findById(appointment_id);
    if (!appointment) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (appointment.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    if (appointment.status === 'cancelado') {
      const error = new Error('Não é possível gerar links para uma consulta cancelada');
      error.statusCode = 400;
      throw error;
    }

    const appUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();

    // Confirmar: token curto de 8 chars, expira em 48h
    const confirmToken = crypto.randomBytes(6).toString('base64url');
    const confirmTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await this.appointmentRepository.update(appointment_id, { confirmToken, confirmTokenExpires });
    const confirmUrl = `${appUrl}/confirmar/${confirmToken}`;

    // Reagendar: JWT com prazo de 7 dias
    const rescheduleToken = this.tokenService.generateTempToken(
      { appointment_id, action: 'reschedule' },
      '7d'
    );
    const rescheduleUrl = `${appUrl}/reagendar/${rescheduleToken}`;

    // RN-05: link de avaliação só disponível após a consulta ser marcada como realizada
    let reviewUrl = null;
    if (appointment.status === 'realizado') {
      const reviewLinkId = uuidv4();
      const reviewLinkExpires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await this.appointmentRepository.update(appointment_id, { activeReviewLinkId: reviewLinkId, reviewLinkExpires });
      reviewUrl = `${appUrl}/avaliar/${reviewLinkId}`;
    }

    return { confirmUrl, rescheduleUrl, reviewUrl };
  }
}

module.exports = GenerateAppointmentLinksOperation;
