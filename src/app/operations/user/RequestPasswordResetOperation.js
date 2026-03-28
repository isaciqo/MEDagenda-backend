class RequestPasswordResetOperation {
  constructor({ userRepository, tokenService, emailService }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.emailService = emailService;
  }

  async execute(email) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    const token = this.tokenService.generateTempToken({ email }, '1h');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.update(user.user_id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    await this.emailService.sendPasswordResetEmail({ email, name: user.name, token });

    return { message: 'If this email exists, a reset link has been sent.' };
  }
}

module.exports = RequestPasswordResetOperation;
