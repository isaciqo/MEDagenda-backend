class BlockedPeriodController {
  constructor({ listBlockedPeriodsOperation, createBlockedPeriodOperation, deleteBlockedPeriodOperation }) {
    this.listBlockedPeriodsOperation = listBlockedPeriodsOperation;
    this.createBlockedPeriodOperation = createBlockedPeriodOperation;
    this.deleteBlockedPeriodOperation = deleteBlockedPeriodOperation;
  }

  async list(req, res) {
    const result = await this.listBlockedPeriodsOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }

  async create(req, res) {
    const result = await this.createBlockedPeriodOperation.execute({
      doctor_id: req.user.user_id,
      ...req.body,
    });
    res.status(201).json(result);
  }

  async delete(req, res) {
    const result = await this.deleteBlockedPeriodOperation.execute(req.params.blocked_id, req.user.user_id);
    res.status(200).json(result);
  }
}

module.exports = BlockedPeriodController;
