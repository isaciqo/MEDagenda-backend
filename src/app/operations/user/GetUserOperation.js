class GetUserOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('User not found');
    }
    const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = user.toObject();
    return safeUser;
  }
}

module.exports = GetUserOperation;
