class CancelEmailChangeOperation {
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

    await this.userRepository.update(user_id, {
      pendingEmail: null,
      pendingEmailRequestedAt: null,
    });

    return { message: 'Troca de e-mail cancelada' };
  }
}

module.exports = CancelEmailChangeOperation;
