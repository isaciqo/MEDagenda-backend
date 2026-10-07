const crypto = require('crypto');

// Mesmo padrão do GetPatientIntakeLinkOperation: gera sob demanda na primeira
// vez que o médico abre a tela, nunca no cadastro da conta.
class GetPublicBookingLinkOperation {
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

    if (user.publicBookingCode) {
      return { code: user.publicBookingCode };
    }

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

module.exports = GetPublicBookingLinkOperation;
