class HandleStripeWebhookOperation {
  constructor({ stripeService, userRepository }) {
    this.stripeService = stripeService;
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
      // invoice.payment_failed: handled via subscription status change — no extra action needed
    }
  }

  async _onCheckoutCompleted(session) {
    const userId = session.metadata?.user_id;
    if (!userId) return;

    // Fetch full subscription to get plan and period info
    const sub = await this.stripeService.stripe.subscriptions.retrieve(session.subscription);
    const priceId = sub.items.data[0]?.price?.id;
    const plan = this.stripeService.getPlanFromPriceId(priceId) || 'profissional';
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null;

    await this.userRepository.update(userId, {
      plan,
      stripeCustomerId:     session.customer,
      stripeSubscriptionId: sub.id,
      ...(periodEnd && { planExpiresAt: periodEnd }),
      trialExpiresAt: null, // trial replaced by real subscription
    });
  }

  async _onSubscriptionUpdated(sub) {
    const user = await this.userRepository.findByStripeCustomerId(sub.customer);
    if (!user) return;

    const priceId = sub.items.data[0]?.price?.id;
    const plan = this.stripeService.getPlanFromPriceId(priceId);
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null;

    const updates = {};
    if (plan) updates.plan = plan;
    if (periodEnd) updates.planExpiresAt = periodEnd;
    if (!Object.keys(updates).length) return;

    await this.userRepository.update(user.user_id, updates);
  }

  async _onSubscriptionDeleted(sub) {
    const user = await this.userRepository.findByStripeCustomerId(sub.customer);
    if (!user) return;

    // Keep plan slug for display but expire it immediately
    await this.userRepository.update(user.user_id, {
      stripeSubscriptionId: null,
      planExpiresAt: new Date(),
    });
  }
}

module.exports = HandleStripeWebhookOperation;
