class AuthController {
  constructor({
    createUserOperation,
    loginOperation,
    getMeOperation,
    requestPasswordResetOperation,
  }) {
    this.createUserOperation = createUserOperation;
    this.loginOperation = loginOperation;
    this.getMeOperation = getMeOperation;
    this.requestPasswordResetOperation = requestPasswordResetOperation;
  }

  async register(req, res) {
    const result = await this.createUserOperation.execute(req.body);
    res.status(201).json(result);
  }

  async login(req, res) {
    const result = await this.loginOperation.execute(req.body);
    res.status(200).json(result);
  }

  async me(req, res) {
    const result = await this.getMeOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }

  async forgotPassword(req, res) {
    await this.requestPasswordResetOperation.execute(req.body.email);
    res.status(204).send();
  }

  async logout(req, res) {
    res.status(204).send();
  }
}

module.exports = AuthController;
