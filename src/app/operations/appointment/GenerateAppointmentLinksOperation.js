const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class GenerateAppointmentLinksOperation {
  constructor({ appointmentRepository, tokenService }) {
    this.appointmentRepository = appointmentRepository;
    this.tokenService = tokenService;
  }

  async execute(appointment_id) {
    const appointment = await this.appointmentRepository.findById(appointment_id);
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';

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

    // Avaliar: UUID único salvo no banco — cada novo link invalida o anterior
    const reviewLinkId = uuidv4();
    await this.appointmentRepository.update(appointment_id, { activeReviewLinkId: reviewLinkId });
    const reviewUrl = `${appUrl}/avaliar/${reviewLinkId}`;

    return { confirmUrl, rescheduleUrl, reviewUrl };
  }
}

module.exports = GenerateAppointmentLinksOperation;
