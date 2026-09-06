const logger = require('../../../lib/logger');

class DeleteShiftOperation {
  constructor({ shiftRepository }) {
    this.shiftRepository = shiftRepository;
  }

  async execute(shift_id, doctor_id) {
    const existing = await this.shiftRepository.findById(shift_id);
    if (!existing) {
      logger.warn('shift.delete: plantão não encontrado', { shift_id, doctor_id });
      const error = new Error('Plantão não encontrado');
      error.statusCode = 404;
      throw error;
    }
    if (existing.doctor_id !== doctor_id) {
      logger.warn('shift.delete: acesso negado (IDOR)', { shift_id, doctor_id });
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    await this.shiftRepository.delete(shift_id);

    logger.info('shift.delete: plantão removido', { shift_id, doctor_id });
    return { message: 'Plantão removido com sucesso' };
  }
}

module.exports = DeleteShiftOperation;
