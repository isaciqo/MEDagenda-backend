class UserController {
  constructor({
    createUserOperation,
    loginOperation,
    getUserOperation,
    updateUserOperation,
    deleteUserOperation,
    changePasswordOperation,
    emailConfirmationOperation,
    requestPasswordResetOperation,
    confirmPasswordResetOperation,
  }) {
    this.createUserOperation = createUserOperation;
    this.loginOperation = loginOperation;
    this.getUserOperation = getUserOperation;
    this.updateUserOperation = updateUserOperation;
    this.deleteUserOperation = deleteUserOperation;
    this.changePasswordOperation = changePasswordOperation;
    this.emailConfirmationOperation = emailConfirmationOperation;
    this.requestPasswordResetOperation = requestPasswordResetOperation;
    this.confirmPasswordResetOperation = confirmPasswordResetOperation;
  }

  async createUser(req, res) {
    const result = await this.createUserOperation.execute(req.body);
    res.status(201).json(result);
  }

  async login(req, res) {
    const result = await this.loginOperation.execute(req.body);
    res.status(200).json(result);
  }

  async confirmEmail(req, res) {
    const result = await this.emailConfirmationOperation.execute(req.params.token);
    res.status(200).json(result);
  }

  async requestPasswordReset(req, res) {
    const result = await this.requestPasswordResetOperation.execute(req.body.email);
    res.status(200).json(result);
  }

  async confirmPasswordReset(req, res) {
    const result = await this.confirmPasswordResetOperation.execute(req.body);
    res.status(200).json(result);
  }

  async getUser(req, res) {
    const result = await this.getUserOperation.execute(req.params.user_id);
    res.status(200).json(result);
  }

  async updateUser(req, res) {
    const result = await this.updateUserOperation.execute(req.params.user_id, req.body);
    res.status(200).json(result);
  }

  async changePassword(req, res) {
    const result = await this.changePasswordOperation.execute({
      user_id: req.params.user_id,
      ...req.body,
    });
    res.status(200).json(result);
  }

  async deleteUser(req, res) {
    const result = await this.deleteUserOperation.execute(req.params.user_id);
    res.status(200).json(result);
  }
}

module.exports = UserController;
