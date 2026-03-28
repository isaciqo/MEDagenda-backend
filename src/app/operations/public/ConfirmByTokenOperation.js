class ConfirmByTokenOperation {
  constructor({ appointmentRepository, tokenService }) {
    this.appointmentRepository = appointmentRepository;
    this.tokenService = tokenService;
  }

  async execute(token) {
    let payload;
    try {
      payload = this.tokenService.verify(token);
    } catch {
      const error = new Error('Link inválido ou expirado');
      error.statusCode = 400;
      throw error;
    }

    if (payload.action !== 'confirm') {
      const error = new Error('Link inválido');
      error.statusCode = 400;
      throw error;
    }

    const appointment = await this.appointmentRepository.findById(payload.appointment_id);
    if (!appointment) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (appointment.status === 'cancelado') {
      const error = new Error('Esta consulta foi cancelada');
      error.statusCode = 400;
      throw error;
    }

    if (appointment.status === 'confirmado' || appointment.status === 'realizado') {
      return {
        alreadyConfirmed: true,
        patientName: appointment.patient.name,
        date: appointment.date,
        time: appointment.time,
      };
    }

    await this.appointmentRepository.update(payload.appointment_id, { status: 'confirmado' });

    return {
      alreadyConfirmed: false,
      patientName: appointment.patient.name,
      date: appointment.date,
      time: appointment.time,
    };
  }
}

module.exports = ConfirmByTokenOperation;
