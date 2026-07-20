const logger = require('../../../lib/logger');

class DeleteAppointmentOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointment_id, doctor_id) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      logger.warn('appointment.delete: consulta não encontrada', { appointment_id, doctor_id });
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (existing.doctor_id !== doctor_id) {
      logger.warn('appointment.delete: acesso negado (IDOR)', { appointment_id, doctor_id });
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    // Remove retornos vinculados antes de deletar a consulta principal
    const { deletedCount } = await this.appointmentRepository.deleteByReturnOf(appointment_id);
    if (deletedCount > 0) {
      logger.info('appointment.delete: retorno(s) vinculado(s) removido(s)', { appointment_id, count: deletedCount });
    }

    await this.appointmentRepository.delete(appointment_id);

    logger.info('appointment.delete: consulta removida', { appointment_id, doctor_id });
    return { message: 'Consulta removida com sucesso' };
  }
}

module.exports = DeleteAppointmentOperation;
