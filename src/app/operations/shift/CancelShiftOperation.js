const logger = require('../../../lib/logger');

class CancelShiftOperation {
  constructor({ shiftRepository }) {
    this.shiftRepository = shiftRepository;
  }

  async execute(shift_id, doctor_id) {
    const existing = await this.shiftRepository.findById(shift_id);
    if (!existing) {
      logger.warn('shift.cancel: plantão não encontrado', { shift_id, doctor_id });
      const error = new Error('Plantão não encontrado');
      error.statusCode = 404;
      throw error;
    }
    if (existing.doctor_id !== doctor_id) {
      logger.warn('shift.cancel: acesso negado (IDOR)', { shift_id, doctor_id });
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    if (['realizado', 'cancelado'].includes(existing.status)) {
      const error = new Error(
        existing.status === 'realizado'
          ? 'Não é possível cancelar um plantão já realizado'
          : 'Este plantão já está cancelado'
      );
      error.statusCode = 409;
      throw error;
    }

    const s = await this.shiftRepository.update(shift_id, { status: 'cancelado' });

    logger.info('shift.cancel: plantão cancelado', { shift_id, doctor_id });

    return {
      id: s.shift_id,
      locationName: s.locationName,
      date: s.date,
      time: s.time,
      endDate: s.endDate,
      endTime: s.endTime,
      estimatedValue: s.estimatedValue,
      status: s.status,
    };
  }
}

module.exports = CancelShiftOperation;
