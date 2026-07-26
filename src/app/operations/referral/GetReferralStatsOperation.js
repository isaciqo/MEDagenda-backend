const REFERRAL_GOAL = 10;

class GetReferralStatsOperation {
  constructor({ userRepository, referralRepository, getReferralCodeOperation }) {
    this.userRepository = userRepository;
    this.referralRepository = referralRepository;
    this.getReferralCodeOperation = getReferralCodeOperation;
  }

  async execute(user_id) {
    const { referralCode } = await this.getReferralCodeOperation.execute(user_id);

    const [user, referrals] = await Promise.all([
      this.userRepository.findById(user_id),
      this.referralRepository.findAllByReferrer(user_id),
    ]);

    return {
      referralCode,
      referralCount: referrals.length,
      referralGoal: REFERRAL_GOAL,
      rewardGrantedAt: user.referralRewardGrantedAt || null,
      referrals: referrals.map(r => ({ createdAt: r.createdAt })),
    };
  }
}

module.exports = GetReferralStatsOperation;
