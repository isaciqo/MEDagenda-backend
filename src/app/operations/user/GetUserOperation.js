class GetUserOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const {
      _id, __v,
      password, resetPasswordToken, resetPasswordExpires,
      tokenVersion, loginAttempts, lockUntil,
      trialWarningSentAt,
      stripeCustomerId, stripeSubscriptionId,
      googleId,
      ...safeUser
    } = user.toObject();

    return safeUser;
  }
}

module.exports = GetUserOperation;
