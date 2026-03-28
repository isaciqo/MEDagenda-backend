class EmailConfirmationOperation {
  constructor({ userRepository, tokenService }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  async execute(token) {
    let decoded;
    try {
      decoded = this.tokenService.verify(token);
    } catch {
      throw new Error('Invalid or expired confirmation token');
    }

    const user = await this.userRepository.findByEmail(decoded.email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isConfirmed) {
      return { message: 'Email already confirmed' };
    }

    await this.userRepository.update(user.user_id, { isConfirmed: true });
    return { message: 'Email confirmed successfully' };
  }
}

module.exports = EmailConfirmationOperation;
