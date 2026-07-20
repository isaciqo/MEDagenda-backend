const ProcessedStripeEvent = require('../../../database/models/ProcessedStripeEvent');
const logger = require('../../../lib/logger');

class HandleStripeWebhookOperation {
  constructor({ stripeService, userRepository }) {
    this.stripeService  = stripeService;
    this.userRepository = userRepository;
  }

  async execute(rawBody, signature) {
    let event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      const error = new Error(`Webhook signature inválida: ${err.message}`);
      error.statusCode = 400;
      throw error;
    }

    // Idempotência: ignora eventos já processados
    try {
      await ProcessedStripeEvent.create({ eventId: event.id });
    } catch (err) {
      if (err.code === 11000) {
        logger.info(`Webhook: evento ${event.id} já processado — ignorando`);
        return;
      }
      throw err;
    }

    logger.info(`Webhook: processando evento ${event.type} (${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this._onCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this._onSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this._onSubscriptionDeleted(event.data.object);
        break;
    }
  }

  async _onCheckoutCompleted(session) {
    const userId = session.metadata?.user_id;
    if (!userId) return;

    // S03: checkout de pagamento único não tem subscription — ignorar silenciosamente
    if (!session.subscription) return;

    const sub      = await this.stripeService.stripe.subscriptions.retrieve(session.subscription);
    const priceId  = sub.items.data[0]?.price?.id;
    const plan     = this.stripeService.getPlanFromPriceId(priceId) || 'profissional';
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

    await this.userRepository.update(userId, {
      plan,
      stripeCustomerId:     session.customer,
      stripeSubscriptionId: sub.id,
      ...(periodEnd && { planExpiresAt: periodEnd }),
      trialExpiresAt: null,
    });

    logger.info(`Webhook: checkout.session.completed — user ${userId} → plano ${plan}`);
  }

  async _onSubscriptionUpdated(sub) {
    const user = await this.userRepository.findByStripeCustomerId(sub.customer);
    if (!user) return;

    const priceId   = sub.items.data[0]?.price?.id;
    const plan      = this.stripeService.getPlanFromPriceId(priceId);
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

    const updates = {};
    if (plan)      updates.plan          = plan;
    if (periodEnd) updates.planExpiresAt = periodEnd;
    if (!Object.keys(updates).length) return;

    await this.userRepository.update(user.user_id, updates);
    logger.info(`Webhook: customer.subscription.updated — user ${user.user_id} → ${JSON.stringify(updates)}`);
  }

  async _onSubscriptionDeleted(sub) {
    const user = await this.userRepository.findByStripeCustomerId(sub.customer);
    if (!user) return;

    // S02: usar current_period_end para garantir acesso até fim do período pago
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : new Date();

    await this.userRepository.update(user.user_id, {
      stripeSubscriptionId: null,
      planExpiresAt: periodEnd,
    });

    logger.info(`Webhook: customer.subscription.deleted — user ${user.user_id}`);
  }
}

module.exports = HandleStripeWebhookOperation;
