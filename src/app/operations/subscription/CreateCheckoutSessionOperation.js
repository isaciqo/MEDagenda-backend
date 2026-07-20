const logger = require('../../../lib/logger');

class CreateCheckoutSessionOperation {
  constructor({ userRepository, stripeService }) {
    this.userRepository = userRepository;
    this.stripeService  = stripeService;
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

    if (!user.stripeCustomerId) {
      await this.userRepository.update(user_id, { stripeCustomerId: customer.id });
    }

    // Se já tem assinatura ativa, faz upgrade em vez de criar nova Checkout Session
    if (user.stripeSubscriptionId) {
      try {
        const existing = await this.stripeService.stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        if (existing.status === 'active' || existing.status === 'trialing') {
          const updated = await this.stripeService.stripe.subscriptions.update(
            user.stripeSubscriptionId,
            {
              items: [{ id: existing.items.data[0].id, price: priceId }],
              proration_behavior: 'create_prorations',
            }
          );

          const periodEnd = updated.current_period_end
            ? new Date(updated.current_period_end * 1000)
            : null;

          await this.userRepository.update(user_id, {
            plan,
            ...(periodEnd && { planExpiresAt: periodEnd }),
          });

          logger.info(`subscription.upgrade: user ${user_id} → plano ${plan}`);
          const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
          return { url: `${frontendUrl}/assinatura/sucesso`, upgraded: true };
        }
      } catch (err) {
        // Assinatura não encontrada ou inválida — segue para novo checkout
        logger.warn(`subscription.upgrade: falha ao recuperar assinatura existente — ${err.message}`);
      }
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
    const session = await this.stripeService.createCheckoutSession({
      customerId: customer.id,
      priceId,
      userId:     user_id,
      successUrl: `${frontendUrl}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl:  `${frontendUrl}/assinatura/cancelado`,
    });

    return { url: session.url, sessionId: session.id };
  }
}

module.exports = CreateCheckoutSessionOperation;
