const crypto = require('crypto');

// Mesmo padrão do GetReferralCodeOperation: gera sob demanda na primeira vez
// que o médico abre a tela, nunca no cadastro da conta — evita gerar um
// código pra quem nunca vai usar essa feature.
class GetPatientIntakeLinkOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (user.patientIntakeCode) {
      return { code: user.patientIntakeCode };
    }

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

module.exports = GetPatientIntakeLinkOperation;
