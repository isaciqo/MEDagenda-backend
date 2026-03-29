class ConfirmByIdOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointment_id) {
    const appointment = await this.appointmentRepository.findById(appointment_id);
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

    await this.appointmentRepository.update(appointment_id, { status: 'confirmado' });

    return {
      alreadyConfirmed: false,
      patientName: appointment.patient.name,
      date: appointment.date,
      time: appointment.time,
    };
  }
}

module.exports = ConfirmByIdOperation;
