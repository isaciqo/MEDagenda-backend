class ConfirmByIdOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(token) {
    const appointment = await this.appointmentRepository.findByConfirmToken(token);
    if (!appointment) {
      const error = new Error('Link de confirmação inválido ou expirado');
      error.statusCode = 400;
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

    // A16: confirmTokenExpires existia no banco mas nunca era checado, então o link
    // nunca expirava de fato. Só se aplica aqui: se já está confirmado/realizado
    // (branch acima) ou cancelado, a expiração é irrelevante.
    if (appointment.confirmTokenExpires && appointment.confirmTokenExpires < new Date()) {
      const error = new Error('Link de confirmação expirado. Entre em contato para confirmar sua presença.');
      error.statusCode = 400;
      throw error;
    }

    await this.appointmentRepository.update(appointment.appointment_id, {
      status: 'confirmado',
      confirmToken: null,
      confirmTokenExpires: null,
    });

    return {
      alreadyConfirmed: false,
      patientName: appointment.patient.name,
      date: appointment.date,
      time: appointment.time,
    };
  }
}

module.exports = ConfirmByIdOperation;
