const logger = require('../../../lib/logger');

class DeleteLocationOperation {
  constructor({ locationRepository }) {
    this.locationRepository = locationRepository;
  }

  async execute(location_id, doctor_id) {
    const existing = await this.locationRepository.findById(location_id);
    if (!existing) {
      const error = new Error('Local não encontrado');
      error.statusCode = 404;
      throw error;
    }
    if (existing.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    // Consultas (campo location, string livre) e plantões (locationName/
    // locationColor snapshot) não referenciam o Location por chave estrangeira
    // de verdade — apagar aqui não quebra nem muda histórico nenhum.
    await this.locationRepository.delete(location_id);

    logger.info('location.delete: local removido', { doctor_id, location_id });

    return { message: 'Local removido.' };
  }
}

module.exports = DeleteLocationOperation;
