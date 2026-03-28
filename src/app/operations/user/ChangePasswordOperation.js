class ChangePasswordOperation {
  constructor({ userRepository, hashPasswordService }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
  }

  async execute({ user_id, currentPassword, newPassword }) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.hashPasswordService.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await this.hashPasswordService.hash(newPassword);
    await this.userRepository.update(user_id, { password: hashedPassword });

    return { message: 'Password changed successfully' };
  }
}

module.exports = ChangePasswordOperation;
