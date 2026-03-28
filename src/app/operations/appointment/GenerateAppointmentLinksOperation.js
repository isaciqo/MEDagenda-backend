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
    const expiresIn = '7d';

    const confirmToken = this.tokenService.generateTempToken(
      { appointment_id, action: 'confirm' },
      expiresIn
    );
    const rescheduleToken = this.tokenService.generateTempToken(
      { appointment_id, action: 'reschedule' },
      expiresIn
    );
    const reviewToken = this.tokenService.generateTempToken(
      { appointment_id, action: 'review' },
      expiresIn
    );

    return {
      confirmUrl: `${appUrl}/confirmar/${confirmToken}`,
      rescheduleUrl: `${appUrl}/reagendar/${rescheduleToken}`,
      reviewUrl: `${appUrl}/avaliar/${reviewToken}`,
    };
  }
}

module.exports = GenerateAppointmentLinksOperation;
