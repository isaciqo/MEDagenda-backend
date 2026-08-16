const logger = require('../../../lib/logger');

class RealizeAppointmentOperation {
  constructor({ appointmentRepository, userRepository }) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
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

    // netValue é um snapshot da taxa configurada em Settings no momento do
    // recebimento — não recalcula depois se o médico mudar a taxa (não
    // reescreve histórico financeiro retroativamente).
    const netValue = await this._computeNetValue(doctor_id, paidValue, paymentMethod);
    if (netValue === null) {
      const error = new Error('A taxa configurada para essa forma de pagamento é maior que o valor pago.');
      error.statusCode = 400;
      throw error;
    }

    const a = await this.appointmentRepository.update(appointment_id, {
      status: 'realizado',
      paidValue,
      paymentMethod,
      paymentDate,
      netValue,
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
      netValue: a.netValue,
      paymentMethod: a.paymentMethod,
      paymentDate: a.paymentDate,
      status: a.status,
      notes: a.notes,
    };
  }

  // Retorna null (em vez de lançar) quando a taxa configurada supera o valor
  // pago — deixa o caller decidir como reportar isso pro cliente.
  async _computeNetValue(doctor_id, paidValue, paymentMethod) {
    if (!paidValue || !paymentMethod) return paidValue || 0;

    const doctor = await this.userRepository.findById(doctor_id);
    const fees = doctor?.paymentMethodFees;
    const feeConfig = fees instanceof Map ? fees.get(paymentMethod) : fees?.[paymentMethod];
    if (!feeConfig) return paidValue;

    // As duas taxas se somam: percentual sobre o valor pago + valor fixo.
    const fee = (paidValue * (feeConfig.percentage || 0)) / 100 + (feeConfig.fixed || 0);
    if (fee > paidValue) return null;
    return Math.max(0, paidValue - fee);
  }
}

module.exports = RealizeAppointmentOperation;
