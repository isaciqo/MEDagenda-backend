const logger = require('../../../lib/logger');

const REFERRAL_GOAL = 10;

class ProcessReferralOperation {
  constructor({ userRepository, referralRepository }) {
    this.userRepository = userRepository;
    this.referralRepository = referralRepository;
  }

  async execute({ code, referredUserId }) {
    const referrer = await this.userRepository.findByReferralCode(code);
    if (!referrer) return; // código inválido — ignora silenciosamente

    if (referrer.user_id === referredUserId) return; // sem auto-indicação

    const alreadyExists = await this.referralRepository.existsByReferred(referredUserId);
    if (alreadyExists) return;

    try {
      await this.referralRepository.create({
        referrer_id: referrer.user_id,
        referred_id: referredUserId,
      });
    } catch (err) {
      if (err.code === 11000) return; // race condition — já processado
      throw err;
    }

    const count = await this.referralRepository.countByReferrer(referrer.user_id);
    if (count >= REFERRAL_GOAL && !referrer.referralRewardGrantedAt) {
      await this._grantReward(referrer);
      logger.info('referral: recompensa concedida', { referrer_id: referrer.user_id });
    }
  }

  async _grantReward(user) {
    const now = new Date();
    const currentExpiry = user.plan === 'trial' ? user.trialExpiresAt : user.planExpiresAt;
    const isActive = currentExpiry && currentExpiry > now;

    let updateFields;
    if (isActive) {
      // Plano ativo: estende a data atual em 30 dias
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + 30);
      const field = user.plan === 'trial' ? 'trialExpiresAt' : 'planExpiresAt';
      updateFields = { [field]: newExpiry, referralRewardGrantedAt: now };
    } else {
      // Plano expirado ou sem plano: concede 30 dias de trial gratuito a partir de agora
      const newExpiry = new Date(now);
      newExpiry.setDate(newExpiry.getDate() + 30);
      updateFields = { plan: 'trial', trialExpiresAt: newExpiry, referralRewardGrantedAt: now };
    }

    await this.userRepository.update(user.user_id, updateFields);
  }
}

module.exports = ProcessReferralOperation;
