class FinancialController {
  constructor({ getFinancialSummaryOperation }) {
    this.getFinancialSummaryOperation = getFinancialSummaryOperation;
  }

  async summary(req, res) {
    const result = await this.getFinancialSummaryOperation.execute({
      doctor_id: req.user.user_id,
      period: req.query.period,
    });
    res.status(200).json(result);
  }
}

module.exports = FinancialController;
