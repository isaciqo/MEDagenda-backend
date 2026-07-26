const Referral = require('../../../database/models/referral/referralModel');

class ReferralRepository {
  async create(data) {
    const referral = new Referral(data);
    return referral.save();
  }

  async findAllByReferrer(referrer_id) {
    return Referral.find({ referrer_id }).sort({ createdAt: -1 });
  }

  async countByReferrer(referrer_id) {
    return Referral.countDocuments({ referrer_id });
  }

  async existsByReferred(referred_id) {
    return Referral.exists({ referred_id });
  }
}

module.exports = ReferralRepository;
