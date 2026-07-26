const crypto = require('crypto');

class GetReferralCodeOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.referralCode) {
      return { referralCode: user.referralCode };
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.userRepository.findByReferralCode(candidate);
      if (!existing) {
        await this.userRepository.update(user_id, { referralCode: candidate });
        return { referralCode: candidate };
      }
    }

    const err = new Error('Failed to generate unique referral code');
    err.statusCode = 500;
    throw err;
  }
}

module.exports = GetReferralCodeOperation;
