class CreatePortalSessionOperation {
  constructor({ userRepository, stripeService }) {
    this.userRepository = userRepository;
    this.stripeService = stripeService;
  }

  async execute(user_id) {
    const user = await this.userRepository.findById(user_id);
    if (!user || !user.stripeCustomerId) {
      const err = new Error('Nenhuma assinatura ativa. Faça upgrade primeiro.');
      err.statusCode = 400;
      throw err;
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
    const session = await this.stripeService.createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${frontendUrl}/configuracoes`,
    });

    return { url: session.url };
  }
}

module.exports = CreatePortalSessionOperation;
