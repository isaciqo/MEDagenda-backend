class ConfirmPasswordResetOperation {
  constructor({ userRepository, tokenService, hashPasswordService }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.hashPasswordService = hashPasswordService;
  }

  async execute({ token, newPassword }) {
    let decoded;
    try {
      decoded = this.tokenService.verify(token);
    } catch {
      throw new Error('Invalid or expired reset token');
    }

    const user = await this.userRepository.findByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await this.hashPasswordService.hash(newPassword);

    await this.userRepository.update(user.user_id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return { message: 'Password reset successfully' };
  }
}

module.exports = ConfirmPasswordResetOperation;
