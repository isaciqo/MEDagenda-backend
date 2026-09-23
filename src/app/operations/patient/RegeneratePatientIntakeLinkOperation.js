const crypto = require('crypto');

// Gera um código novo mesmo que já exista um — usado pelo botão "Gerar novo
// link" em Configurações, pra invalidar um link que vazou em algum lugar
// indevido. O código antigo simplesmente para de bater com qualquer usuário.
class RegeneratePatientIntakeLinkOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.userRepository.findByPatientIntakeCode(candidate);
      if (!existing) {
        await this.userRepository.update(user_id, { patientIntakeCode: candidate });
        return { code: candidate };
      }
    }

    const err = new Error('Falha ao gerar um código único');
    err.statusCode = 500;
    throw err;
  }
}

module.exports = RegeneratePatientIntakeLinkOperation;
