class ValidateLoginService {
  constructor({ userRepository, hashPasswordService }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
  }

  async validate(email, password) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isConfirmed) {
      throw new Error('Account not confirmed. Please check your email.');
    }

    const isValid = await this.hashPasswordService.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  }
}

module.exports = ValidateLoginService;
