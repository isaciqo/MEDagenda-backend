class DeleteBlockedPeriodOperation {
  constructor({ blockedPeriodRepository }) {
    this.blockedPeriodRepository = blockedPeriodRepository;
  }

  async execute(blocked_id, doctor_id) {
    const existing = await this.blockedPeriodRepository.findById(blocked_id);
    if (!existing) {
      const error = new Error('Bloqueio não encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (existing.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    await this.blockedPeriodRepository.delete(blocked_id);
    return { id: blocked_id };
  }
}

module.exports = DeleteBlockedPeriodOperation;
