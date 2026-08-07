class AuthController {
  constructor({
    createUserOperation,
    loginOperation,
    logoutOperation,
    getMeOperation,
    requestPasswordResetOperation,
    confirmPasswordResetOperation,
    googleAuthOperation,
    refreshTokenOperation,
    auditService,
  }) {
    this.createUserOperation = createUserOperation;
    this.loginOperation = loginOperation;
    this.logoutOperation = logoutOperation;
    this.getMeOperation = getMeOperation;
    this.requestPasswordResetOperation = requestPasswordResetOperation;
    this.confirmPasswordResetOperation = confirmPasswordResetOperation;
    this.googleAuthOperation = googleAuthOperation;
    this.refreshTokenOperation = refreshTokenOperation;
    this.auditService = auditService;
  }

  async register(req, res) {
    const result = await this.createUserOperation.execute(req.body);
    res.status(201).json(result);
  }

  async login(req, res) {
    const result = await this.loginOperation.execute(req.body);
    await this.auditService.log({
      actor_id: result.actor_id || req.body.email,
      action: 'auth.login',
      resource_type: 'user',
      ip_address: req.ip,
    });
    res.status(200).json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  }

  async me(req, res) {
    const result = await this.getMeOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }

  async forgotPassword(req, res) {
    await this.requestPasswordResetOperation.execute(req.body.email);
    await this.auditService.log({
      actor_id: req.body.email,
      action: 'auth.password_reset_request',
      resource_type: 'user',
      ip_address: req.ip,
    });
    res.status(204).send();
  }

  async resetPassword(req, res) {
    const result = await this.confirmPasswordResetOperation.execute(req.body);
    await this.auditService.log({
      actor_id: result.user_id,
      action: 'auth.password_reset_confirm',
      resource_type: 'user',
      resource_id: result.user_id,
      ip_address: req.ip,
    });
    res.status(204).send();
  }

  async googleAuth(req, res) {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Credencial do Google ausente.' });
    }
    const result = await this.googleAuthOperation.execute(credential);

    if (result.needsConfirmation) {
      return res.status(200).json({
        needsConfirmation: true,
        message: 'Verifique seu e-mail para ativar sua conta.',
      });
    }

    await this.auditService.log({
      actor_id: 'google-oauth',
      action: 'auth.google_login',
      resource_type: 'user',
      ip_address: req.ip,
    });
    return res.status(200).json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  }

  async refresh(req, res) {
    const result = await this.refreshTokenOperation.execute(req.body.refreshToken);
    res.status(200).json(result);
  }

  async logout(req, res) {
    await this.logoutOperation.execute(req.user.user_id);
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'auth.logout',
      resource_type: 'user',
      ip_address: req.ip,
    });
    res.status(204).send();
  }
}

module.exports = AuthController;
