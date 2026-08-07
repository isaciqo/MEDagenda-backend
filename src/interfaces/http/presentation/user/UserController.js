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
    requestEmailChangeOperation,
    confirmEmailChangeOperation,
    cancelEmailChangeOperation,
    auditService,
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
    this.requestEmailChangeOperation = requestEmailChangeOperation;
    this.confirmEmailChangeOperation = confirmEmailChangeOperation;
    this.cancelEmailChangeOperation = cancelEmailChangeOperation;
    this.auditService = auditService;
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
    await this.auditService.log({
      actor_id: result.user_id,
      action: 'auth.email_confirmed',
      resource_type: 'user',
      resource_id: result.user_id,
      ip_address: req.ip,
    });
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
    await this.auditService.log({
      actor_id: req.params.user_id,
      action: 'auth.password_change',
      resource_type: 'user',
      resource_id: req.params.user_id,
      ip_address: req.ip,
    });
    res.status(200).json(result);
  }

  async requestEmailChange(req, res) {
    const result = await this.requestEmailChangeOperation.execute({
      user_id: req.params.user_id,
      ...req.body,
    });
    await this.auditService.log({
      actor_id: req.params.user_id,
      action: 'auth.email_change_requested',
      resource_type: 'user',
      resource_id: req.params.user_id,
      ip_address: req.ip,
    });
    res.status(200).json(result);
  }

  async confirmEmailChange(req, res) {
    const result = await this.confirmEmailChangeOperation.execute(req.params.token);
    res.status(200).json(result);
  }

  async cancelEmailChange(req, res) {
    const result = await this.cancelEmailChangeOperation.execute(req.params.user_id);
    res.status(200).json(result);
  }

  async deleteUser(req, res) {
    const result = await this.deleteUserOperation.execute(req.params.user_id);
    res.status(200).json(result);
  }
}

module.exports = UserController;
