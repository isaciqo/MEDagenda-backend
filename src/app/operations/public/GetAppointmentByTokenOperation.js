class GetAppointmentByTokenOperation {
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

    if (payload.action !== 'review') {
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

    return {
      appointmentId: appointment.appointment_id,
      patientName: appointment.patient.name,
      date: appointment.date,
      time: appointment.time,
    };
  }
}

module.exports = GetAppointmentByTokenOperation;
