const logger = require('../../../lib/logger');

class CancelAppointmentOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointment_id, doctor_id) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      logger.warn('appointment.cancel: consulta não encontrada', { appointment_id, doctor_id });
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (existing.doctor_id !== doctor_id) {
      logger.warn('appointment.cancel: acesso negado (IDOR)', { appointment_id, doctor_id });
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    // A01: não permite cancelar consulta já cancelada ou realizada
    if (['realizado', 'cancelado'].includes(existing.status)) {
      const error = new Error(
        existing.status === 'realizado'
          ? 'Não é possível cancelar uma consulta já realizada'
          : 'Esta consulta já está cancelada'
      );
      error.statusCode = 409;
      throw error;
    }

    const a = await this.appointmentRepository.update(appointment_id, { status: 'cancelado' });

    // A02: deleta retorno vinculado ao cancelar a consulta original
    const { deletedCount } = await this.appointmentRepository.deleteByReturnOf(appointment_id);
    if (deletedCount > 0) {
      logger.info('appointment.cancel: retorno(s) vinculado(s) removido(s)', { appointment_id, count: deletedCount });
    }

    logger.info('appointment.cancel: consulta cancelada', { appointment_id, doctor_id });

    return {
      id: a.appointment_id,
      patient: a.patient,
      type: a.type,
      date: a.date,
      time: a.time,
      estimatedValue: a.estimatedValue,
      paidValue: a.paidValue,
      paymentMethod: a.paymentMethod,
      paymentDate: a.paymentDate,
      status: a.status,
      notes: a.notes,
    };
  }
}

module.exports = CancelAppointmentOperation;
