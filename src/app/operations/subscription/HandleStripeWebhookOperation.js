const ProcessedStripeEvent = require('../../../database/models/ProcessedStripeEvent');
const logger = require('../../../lib/logger');

class HandleStripeWebhookOperation {
  constructor({ stripeService, userRepository, sendCancellationSurveyOperation }) {
    this.stripeService  = stripeService;
    this.userRepository = userRepository;
    this.sendCancellationSurveyOperation = sendCancellationSurveyOperation;
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

    // Idempotência: ignora eventos já processados.
    // Guarda o payload bruto também — a Stripe só garante o evento disponível via API
    // por um tempo limitado; pra investigar algo mais antigo, isso é a única fonte própria.
    try {
      await ProcessedStripeEvent.create({ eventId: event.id, type: event.type, payload: event });
    } catch (err) {
      if (err.code === 11000) {
        logger.info(`Webhook: ${event.type} ignorado (evento já processado antes, nada foi alterado)`, { event_id: event.id });
        return;
      }
      throw err;
    }

    logger.info(`Webhook: processando evento ${event.type}`, {
      event_id: event.id,
      api_version: event.api_version,
    });

    switch (event.type) {
      case 'checkout.session.completed':
        await this._onCheckoutCompleted(event);
        break;
      case 'customer.subscription.updated':
        await this._onSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await this._onSubscriptionDeleted(event);
        break;
      default:
        logger.info(`Webhook: ${event.type} ignorado (tipo não tratado, nada foi alterado)`, { event_id: event.id });
    }
  }

  async _onCheckoutCompleted(event) {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    if (!userId) {
      logger.warn('Webhook: checkout.session.completed ignorado (sessão sem metadata.user_id, nada foi alterado)', {
        event_id: event.id,
        session_id: session.id,
        customer: session.customer,
      });
      return;
    }

    // S03: checkout de pagamento único não tem subscription — ignorar silenciosamente
    if (!session.subscription) return;

    const sub        = await this.stripeService.stripe.subscriptions.retrieve(session.subscription);
    const priceId    = sub.items.data[0]?.price?.id;
    const mappedPlan = this.stripeService.getPlanFromPriceId(priceId);
    const plan       = mappedPlan || 'profissional';
    const periodEnd  = this.stripeService.getPeriodEnd(sub);

    if (!mappedPlan) {
      logger.warn('Webhook: checkout.session.completed com price sem plano mapeado, assumindo profissional', {
        event_id: event.id,
        user_id: userId,
        price_id: priceId,
      });
    }

    await this.userRepository.update(userId, {
      plan,
      stripeCustomerId:     session.customer,
      stripeSubscriptionId: sub.id,
      ...(periodEnd && { planExpiresAt: periodEnd, planWarningSentAt: null }),
      trialExpiresAt: null,
    });

    logger.info(`Webhook: checkout.session.completed (nova assinatura paga, plano ${plan} ativado)`, {
      event_id: event.id,
      user_id: userId,
      email: session.customer_details?.email,
      customer: session.customer,
      subscription_id: sub.id,
      status: sub.status,
      expira_em: this._formatDate(periodEnd),
    });
  }

  async _onSubscriptionUpdated(event) {
    const sub  = event.data.object;
    const user = await this.userRepository.findByStripeCustomerId(sub.customer);
    if (!user) {
      logger.warn('Webhook: customer.subscription.updated ignorado (nenhum usuário com esse stripeCustomerId, nada foi alterado)', {
        event_id: event.id,
        customer: sub.customer,
        subscription_id: sub.id,
      });
      return;
    }

    const priceId   = sub.items.data[0]?.price?.id;
    const plan      = this.stripeService.getPlanFromPriceId(priceId);
    const periodEnd = this.stripeService.getPeriodEnd(sub);
    const context   = {
      event_id: event.id,
      user_id: user.user_id,
      email: user.email,
      subscription_id: sub.id,
      status: sub.status,
    };

    if (!plan) {
      logger.warn('Webhook: customer.subscription.updated com price sem plano mapeado, plano do usuário não foi alterado', {
        ...context,
        price_id: priceId,
      });
    }

    const updates = {};
    if (plan)      updates.plan          = plan;
    if (periodEnd) {
      updates.planExpiresAt    = periodEnd;
      updates.planWarningSentAt = null; // novo ciclo — reabilita o aviso de expiração pra essa renovação
    }

    const motivo = this._describeSubscriptionChange(sub, event.data.previous_attributes, user).join('; ');

    if (!Object.keys(updates).length) {
      logger.warn(`Webhook: customer.subscription.updated (${motivo}) sem plano nem fim de período no payload, nada foi alterado`, context);
      return;
    }

    await this.userRepository.update(user.user_id, updates);
    logger.info(`Webhook: customer.subscription.updated (${motivo})`, {
      ...context,
      plano: plan && plan !== user.plan ? `${user.plan} → ${plan}` : user.plan,
      expira_em: periodEnd
        ? `${this._formatDate(user.planExpiresAt)} → ${this._formatDate(periodEnd)}`
        : `${this._formatDate(user.planExpiresAt)} (não veio no payload, mantido)`,
      gravado: Object.keys(updates).join(','),
    });
  }

  async _onSubscriptionDeleted(event) {
    const sub  = event.data.object;
    const user = await this.userRepository.findByStripeCustomerId(sub.customer);
    if (!user) {
      logger.warn('Webhook: customer.subscription.deleted ignorado (nenhum usuário com esse stripeCustomerId, nada foi alterado)', {
        event_id: event.id,
        customer: sub.customer,
        subscription_id: sub.id,
      });
      return;
    }

    // S02: usar current_period_end para garantir acesso até fim do período pago
    const periodEnd = this.stripeService.getPeriodEnd(sub) || new Date();

    await this.userRepository.update(user.user_id, {
      stripeSubscriptionId: null,
      planExpiresAt: periodEnd,
      planWarningSentAt: null, // cancelamento define um novo prazo final — precisa poder avisar de novo
    });

    logger.info(`Webhook: customer.subscription.deleted (assinatura encerrada, plano ${user.plan} mantém acesso até expira_em)`, {
      event_id: event.id,
      user_id: user.user_id,
      email: user.email,
      subscription_id: sub.id,
      motivo_stripe: sub.cancellation_details?.reason,
      expira_em: this._formatDate(periodEnd),
    });

    // Pesquisa de motivo de cancelamento — melhor esforço, não pode derrubar
    // o processamento do webhook (que já terminou o que importa acima) se o
    // e-mail falhar.
    try {
      await this.sendCancellationSurveyOperation.execute({
        doctor_id: user.user_id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      });
    } catch (err) {
      logger.warn('Webhook: falha ao disparar pesquisa de cancelamento', { user_id: user.user_id, error: err.message });
    }
  }

  // Traduz o previous_attributes do evento (o que a Stripe diz que mudou na assinatura)
  // em frases legíveis pro log. Um mesmo evento pode trazer mais de uma mudança.
  _describeSubscriptionChange(sub, prev = {}, user) {
    const changes = [];

    const priceId     = sub.items.data[0]?.price?.id;
    const prevPriceId = prev.items?.data?.[0]?.price?.id;
    const plan        = this.stripeService.getPlanFromPriceId(priceId);
    let planChanged   = false;
    if (prevPriceId && prevPriceId !== priceId) {
      const from = this.stripeService.getPlanFromPriceId(prevPriceId) || prevPriceId;
      const to   = plan || priceId;
      planChanged = from !== to;
      // Mesmo plano com price diferente = só mudou o ciclo (mensal/anual)
      changes.push(planChanged ? `troca de plano ${from} → ${to}` : `troca de ciclo de cobrança no plano ${to}`);
    }

    const periodEnd     = sub.current_period_end ?? sub.items.data[0]?.current_period_end;
    const prevPeriodEnd = prev.current_period_end ?? prev.items?.data?.[0]?.current_period_end;
    if (prevPeriodEnd && prevPeriodEnd !== periodEnd) {
      changes.push('renovação, novo ciclo de cobrança');
    }

    if ('cancel_at_period_end' in prev || 'cancel_at' in prev) {
      changes.push(
        sub.cancel_at_period_end || sub.cancel_at
          ? 'cancelamento agendado pro fim do período'
          : 'cancelamento agendado foi desfeito'
      );
    }

    if (prev.status && prev.status !== sub.status) {
      changes.push(`status ${prev.status} → ${sub.status}`);
    }

    if ('default_payment_method' in prev) {
      changes.push('forma de pagamento alterada');
    }

    if (!changes.length) {
      const fields = Object.keys(prev);
      changes.push(fields.length ? `campos alterados na Stripe: ${fields.join(', ')}` : 'evento sem previous_attributes');
    }

    // O banco estava diferente da Stripe sem que este evento fosse uma troca de plano
    if (!planChanged && plan && plan !== user.plan) {
      changes.push(`plano no banco estava ${user.plan}, sincronizado pra ${plan}`);
    }

    return changes;
  }

  _formatDate(date) {
    return date ? new Date(date).toISOString().slice(0, 10) : 'sem data';
  }
}

module.exports = HandleStripeWebhookOperation;
