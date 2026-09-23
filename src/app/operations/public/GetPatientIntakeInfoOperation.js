class GetPatientIntakeInfoOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(code) {
    const user = await this.userRepository.findByPatientIntakeCode(code);
    // Médico "só plantão" nunca tem lista de clientes (Clientes some da navegação
    // pra ele) — um link de autocadastro de cliente não faz sentido pra essa conta,
    // mesmo que o código exista tecnicamente de uma configuração anterior.
    if (!user || !user.consultaEnabled) {
      const error = new Error('Link inválido');
      error.statusCode = 400;
      throw error;
    }

    return {
      doctorName: user.displayName || user.name,
    };
  }
}

module.exports = GetPatientIntakeInfoOperation;
