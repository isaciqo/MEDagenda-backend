const logger = require('../../../lib/logger');

class RealizeAppointmentOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointment_id, doctor_id, { paidValue, paymentMethod, paymentDate }) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      logger.warn('appointment.realize: consulta não encontrada', { appointment_id, doctor_id });
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (existing.doctor_id !== doctor_id) {
      logger.warn('appointment.realize: acesso negado (IDOR)', { appointment_id, doctor_id });
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    // A04: paidValue não pode ser negativo
    if (paidValue !== undefined && paidValue < 0) {
      const error = new Error('O valor pago não pode ser negativo');
      error.statusCode = 400;
      throw error;
    }

    const a = await this.appointmentRepository.update(appointment_id, {
      status: 'realizado',
      paidValue,
      paymentMethod,
      paymentDate,
    });

    logger.info('appointment.realize: consulta realizada', {
      appointment_id,
      doctor_id,
      paidValue,
      paymentMethod,
    });

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

module.exports = RealizeAppointmentOperation;
