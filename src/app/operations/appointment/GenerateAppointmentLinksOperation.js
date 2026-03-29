const { v4: uuidv4 } = require('uuid');

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

    // Confirmar: usa o ID do agendamento diretamente
    const confirmUrl = `${appUrl}/confirmar/${appointment_id}`;

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
