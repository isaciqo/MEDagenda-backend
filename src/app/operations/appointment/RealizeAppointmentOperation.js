const logger = require('../../../lib/logger');
const { resolvePaymentMethods } = require('../../../lib/paymentMethods');

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
    // reescreve histórico financeiro retroativamente). O rótulo salvo no
    // appointment também é um snapshot: se o médico renomear ou remover essa
    // forma de pagamento depois, o histórico continua mostrando o nome de então.
    const resolved = await this._resolvePayment(doctor_id, paidValue, paymentMethod);
    if (resolved === null) {
      const error = new Error('A taxa configurada para essa forma de pagamento é maior que o valor pago.');
      error.statusCode = 400;
      throw error;
    }

    const a = await this.appointmentRepository.update(appointment_id, {
      status: 'realizado',
      paidValue,
      paymentMethod: resolved.label,
      paymentDate,
      netValue: resolved.netValue,
    });

    logger.info('appointment.realize: consulta realizada', {
      appointment_id,
      doctor_id,
      paidValue,
      paymentMethod: resolved.label,
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

  // Resolve o id de forma de pagamento enviado pro rótulo + valor líquido
  // configurados NAQUELE momento. Retorna null (em vez de lançar) quando a
  // taxa configurada supera o valor pago — deixa o caller decidir como
  // reportar isso pro cliente. Se o id não bater com nenhuma forma de
  // pagamento atual (ex: foi removida entre o carregamento da tela e o
  // envio), guarda o valor enviado como rótulo mesmo assim, sem taxa.
  async _resolvePayment(doctor_id, paidValue, paymentMethodId) {
    if (!paidValue || !paymentMethodId) {
      return { label: paymentMethodId || null, netValue: paidValue || 0 };
    }

    const doctor = await this.userRepository.findById(doctor_id);
    const method = resolvePaymentMethods(doctor).find(m => m.id === paymentMethodId);
    if (!method) {
      return { label: paymentMethodId, netValue: paidValue };
    }

    // As duas taxas se somam: percentual sobre o valor pago + valor fixo.
    const fee = (paidValue * (method.percentage || 0)) / 100 + (method.fixed || 0);
    if (fee > paidValue) return null;
    return { label: method.label, netValue: Math.max(0, paidValue - fee) };
  }
}

module.exports = RealizeAppointmentOperation;
