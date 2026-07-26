const { v4: uuidv4 } = require('uuid');

const REFERRAL_GOAL = 10;

class SeedReferralsOperation {
  constructor({ userRepository, referralRepository }) {
    this.userRepository = userRepository;
    this.referralRepository = referralRepository;
  }

  async execute({ referralCode, count = 1 }) {
    const user = await this.userRepository.findByReferralCode(referralCode);
    if (!user) {
      const err = new Error(`Código "${referralCode}" não encontrado. Acesse /indicacoes no app para gerar o código.`);
      err.statusCode = 404;
      throw err;
    }

    const created = [];
    for (let i = 0; i < count; i++) {
      try {
        const doc = await this.referralRepository.create({
          referrer_id: user.user_id,
          referred_id: `seed-${uuidv4()}`,
        });
        created.push(doc);
      } catch {
        // ignora duplicatas
      }
    }

    const total = await this.referralRepository.countByReferrer(user.user_id);

    if (total >= REFERRAL_GOAL && !user.referralRewardGrantedAt) {
      const now = new Date();
      const isTrial = user.plan === 'trial';
      const currentExpiry = isTrial ? user.trialExpiresAt : user.planExpiresAt;
      const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(base);
      newExpiry.setDate(newExpiry.getDate() + 30);
      const field = isTrial ? 'trialExpiresAt' : 'planExpiresAt';
      await this.userRepository.update(user.user_id, { [field]: newExpiry, referralRewardGrantedAt: now });
    }

    return { seeded: created.length, totalReferrals: total };
  }
}

module.exports = SeedReferralsOperation;
