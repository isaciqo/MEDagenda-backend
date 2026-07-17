const Stripe = require('stripe');

const PRICE_IDS = {
  essencial: {
    monthly: process.env.STRIPE_PRICE_ESSENCIAL_MONTHLY,
    annual:  process.env.STRIPE_PRICE_ESSENCIAL_ANNUAL,
  },
  profissional: {
    monthly: process.env.STRIPE_PRICE_PROFISSIONAL_MONTHLY,
    annual:  process.env.STRIPE_PRICE_PROFISSIONAL_ANNUAL,
  },
};

class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2024-06-20',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    this.priceIds = PRICE_IDS;
  }

  async createOrGetCustomer(user) {
    if (user.stripeCustomerId) {
      return { id: user.stripeCustomerId };
    }
    return this.stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { user_id: user.user_id },
    });
  }

  async createCheckoutSession({ customerId, priceId, userId, successUrl, cancelUrl }) {
    return this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: userId },
      subscription_data: { metadata: { user_id: userId } },
      locale: 'pt-BR',
      allow_promotion_codes: true,
    });
  }

  async createPortalSession({ customerId, returnUrl }) {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Cancels at period end — user keeps access until planExpiresAt
  async cancelAtPeriodEnd(subscriptionId) {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async reactivateSubscription(subscriptionId) {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  constructWebhookEvent(rawBody, signature) {
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }

  getPriceId(plan, billingCycle) {
    return this.priceIds[plan]?.[billingCycle] ?? null;
  }

  // Maps a Stripe price ID back to our plan slug
  getPlanFromPriceId(priceId) {
    for (const [plan, cycles] of Object.entries(this.priceIds)) {
      for (const pid of Object.values(cycles)) {
        if (pid && pid === priceId) return plan;
      }
    }
    return null;
  }
}

module.exports = StripeService;
