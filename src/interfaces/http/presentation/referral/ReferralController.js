class ReferralController {
  constructor({ getReferralStatsOperation, seedReferralsOperation }) {
    this.getReferralStatsOperation = getReferralStatsOperation;
    this.seedReferralsOperation = seedReferralsOperation;
  }

  async getStats(req, res) {
    const result = await this.getReferralStatsOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }

  async seed(req, res) {
    const count = Math.min(parseInt(req.body.count ?? 1, 10), 20);
    const result = await this.seedReferralsOperation.execute({
      referralCode: req.body.referralCode,
      count,
    });
    res.status(200).json(result);
  }

}

module.exports = ReferralController;
