class DeleteAppointmentOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointment_id) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    await this.appointmentRepository.delete(appointment_id);
    return { message: 'Consulta removida com sucesso' };
  }
}

module.exports = DeleteAppointmentOperation;
