class CreateCheckoutSessionOperation {
  constructor({ userRepository, stripeService }) {
    this.userRepository = userRepository;
    this.stripeService = stripeService;
  }

  async execute(user_id, plan, billingCycle) {
    const priceId = this.stripeService.getPriceId(plan, billingCycle);
    if (!priceId) {
      const err = new Error('Plano ou ciclo de cobrança inválido.');
      err.statusCode = 400;
      throw err;
    }

    const user = await this.userRepository.findById(user_id);
    if (!user) {
      const err = new Error('Usuário não encontrado.');
      err.statusCode = 404;
      throw err;
    }

    const customer = await this.stripeService.createOrGetCustomer(user);

    // Persist Stripe customer ID if freshly created
    if (!user.stripeCustomerId) {
      await this.userRepository.update(user_id, { stripeCustomerId: customer.id });
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
    const session = await this.stripeService.createCheckoutSession({
      customerId: customer.id,
      priceId,
      userId: user_id,
      successUrl: `${frontendUrl}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl:  `${frontendUrl}/assinatura/cancelado`,
    });

    return { url: session.url, sessionId: session.id };
  }
}

module.exports = CreateCheckoutSessionOperation;
