class UpdateUserOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id, data) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const updated = await this.userRepository.update(user_id, data);
    const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = updated.toObject();
    return safeUser;
  }
}

module.exports = UpdateUserOperation;
