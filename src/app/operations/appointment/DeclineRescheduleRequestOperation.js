class DeclineRescheduleRequestOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointment_id, doctor_id) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (existing.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    if (!existing.rescheduleRequest?.pending) {
      const error = new Error('Não há solicitação de remarcação pendente para esta consulta');
      error.statusCode = 400;
      throw error;
    }

    await this.appointmentRepository.update(appointment_id, {
      rescheduleRequest: { pending: false, requestedDate: null, requestedTime: null, requestedAt: null },
    });

    return {
      id: existing.appointment_id,
      patientPhone: existing.patient.phone,
      patientName: existing.patient.name,
    };
  }
}

module.exports = DeclineRescheduleRequestOperation;
