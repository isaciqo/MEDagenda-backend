class ConfirmPasswordResetOperation {
  constructor({ userRepository, tokenService, hashPasswordService }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.hashPasswordService = hashPasswordService;
  }

  async execute({ token, newPassword }) {
    try {
      this.tokenService.verify(token);
    } catch {
      const err = new Error('Token inválido ou expirado');
      err.status = 400;
      throw err;
    }

    const user = await this.userRepository.findByResetToken(token);
    if (!user) {
      const err = new Error('Token inválido ou expirado');
      err.status = 400;
      throw err;
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
