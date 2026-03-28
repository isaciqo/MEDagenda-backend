const { v4: uuidv4 } = require('uuid');

class CreateUserOperation {
  constructor({ userRepository, hashPasswordService, tokenService }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
    this.tokenService = tokenService;
  }

  async execute({ name, email, password }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await this.hashPasswordService.hash(password);

    const user = await this.userRepository.create({
      user_id: uuidv4(),
      name: name || email.split('@')[0],
      email,
      password: hashedPassword,
      isConfirmed: true,
    });

    const payload = { user_id: user.user_id, email: user.email, role: user.role };
    const accessToken = this.tokenService.generate(payload);
    const refreshToken = this.tokenService.generateTempToken(payload, '7d');

    return { accessToken, refreshToken };
  }
}

module.exports = CreateUserOperation;
