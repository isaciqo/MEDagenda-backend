const logger = require('../../../lib/logger');
const { resolvePaymentMethods } = require('../../../lib/paymentMethods');

class RealizeShiftOperation {
  constructor({ shiftRepository, userRepository }) {
    this.shiftRepository = shiftRepository;
    this.userRepository = userRepository;
  }

  async execute(shift_id, doctor_id, { paidValue, paymentMethod, paymentDate }) {
    const existing = await this.shiftRepository.findById(shift_id);
    if (!existing) {
      logger.warn('shift.realize: plantão não encontrado', { shift_id, doctor_id });
      const error = new Error('Plantão não encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (existing.doctor_id !== doctor_id) {
      logger.warn('shift.realize: acesso negado (IDOR)', { shift_id, doctor_id });
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    if (paidValue !== undefined && paidValue < 0) {
      const error = new Error('O valor pago não pode ser negativo');
      error.statusCode = 400;
      throw error;
    }

    // Mesmo snapshot de taxa/rótulo já usado em RealizeAppointmentOperation —
    // reaproveita a mesma resolução de forma de pagamento do médico.
    const resolved = await this._resolvePayment(doctor_id, paidValue, paymentMethod);
    if (resolved === null) {
      const error = new Error('A taxa configurada para essa forma de pagamento é maior que o valor pago.');
      error.statusCode = 400;
      throw error;
    }

    const s = await this.shiftRepository.update(shift_id, {
      status: 'realizado',
      paidValue,
      paymentMethod: resolved.label,
      paymentDate,
      netValue: resolved.netValue,
    });

    logger.info('shift.realize: plantão realizado', { shift_id, doctor_id, paidValue, paymentMethod: resolved.label });

    return {
      id: s.shift_id,
      locationId: s.locationId,
      locationName: s.locationName,
      locationColor: s.locationColor,
      date: s.date,
      time: s.time,
      endDate: s.endDate,
      endTime: s.endTime,
      estimatedValue: s.estimatedValue,
      paidValue: s.paidValue,
      netValue: s.netValue,
      paymentMethod: s.paymentMethod,
      paymentDate: s.paymentDate,
      status: s.status,
      notes: s.notes,
    };
  }

  async _resolvePayment(doctor_id, paidValue, paymentMethodId) {
    if (!paidValue || !paymentMethodId) {
      return { label: paymentMethodId || null, netValue: paidValue || 0 };
    }

    const doctor = await this.userRepository.findById(doctor_id);
    const method = resolvePaymentMethods(doctor).find(m => m.id === paymentMethodId);
    if (!method) {
      return { label: paymentMethodId, netValue: paidValue };
    }

    const fee = (paidValue * (method.percentage || 0)) / 100 + (method.fixed || 0);
    if (fee > paidValue) return null;
    return { label: method.label, netValue: Math.max(0, paidValue - fee) };
  }
}

module.exports = RealizeShiftOperation;
