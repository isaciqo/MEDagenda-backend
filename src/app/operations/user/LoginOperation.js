class LoginOperation {
  constructor({ validateLoginService, tokenService }) {
    this.validateLoginService = validateLoginService;
    this.tokenService = tokenService;
  }

  async execute({ email, password }) {
    const user = await this.validateLoginService.validate(email, password);

    const payload = { user_id: user.user_id, email: user.email, role: user.role };
    const accessToken = this.tokenService.generate(payload);
    const refreshToken = this.tokenService.generateTempToken(payload, '7d');

    return { accessToken, refreshToken };
  }
}

module.exports = LoginOperation;
