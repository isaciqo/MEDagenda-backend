class SubscriptionController {
  constructor({
    createCheckoutSessionOperation,
    createPortalSessionOperation,
  }) {
    this.createCheckoutSessionOperation = createCheckoutSessionOperation;
    this.createPortalSessionOperation   = createPortalSessionOperation;
  }

  async checkout(req, res) {
    const { plan, billingCycle } = req.body;
    const user_id = req.user.user_id;
    const result = await this.createCheckoutSessionOperation.execute(user_id, plan, billingCycle);
    return res.status(200).json(result);
  }

  async portal(req, res) {
    const user_id = req.user.user_id;
    const result = await this.createPortalSessionOperation.execute(user_id);
    return res.status(200).json(result);
  }
}

module.exports = SubscriptionController;
