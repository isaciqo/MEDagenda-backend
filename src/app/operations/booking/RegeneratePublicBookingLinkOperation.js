const crypto = require('crypto');

// Gera um código novo mesmo que já exista um — usado pelo botão "Gerar novo
// link" em Configurações, pra invalidar um link que vazou em algum lugar
// indevido. O código antigo simplesmente para de bater com qualquer usuário.
class RegeneratePublicBookingLinkOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.userRepository.findByPublicBookingCode(candidate);
      if (!existing) {
        await this.userRepository.update(user_id, { publicBookingCode: candidate });
        return { code: candidate };
      }
    }

    const err = new Error('Falha ao gerar um código único');
    err.statusCode = 500;
    throw err;
  }
}

module.exports = RegeneratePublicBookingLinkOperation;
