// Recusa de um pedido feito pela página pública de agendamento. Não existe
// "voltar pro estado anterior" (diferente da remarcação, que só desfaz o
// campo rescheduleRequest) — a consulta inteira nasceu desse pedido, então
// recusar significa cancelá-la.
class DeclineBookingRequestOperation {
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

    if (existing.status !== 'aguardando_confirmacao') {
      const error = new Error('Esta consulta não está aguardando confirmação');
      error.statusCode = 400;
      throw error;
    }

    await this.appointmentRepository.update(appointment_id, { status: 'cancelado' });

    return {
      id: existing.appointment_id,
      patientName: existing.patient.name,
      patientPhone: existing.patient.phone,
    };
  }
}

module.exports = DeclineBookingRequestOperation;
