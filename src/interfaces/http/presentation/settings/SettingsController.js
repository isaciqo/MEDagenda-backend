class SettingsController {
  constructor({ getSettingsOperation, updateSettingsOperation }) {
    this.getSettingsOperation = getSettingsOperation;
    this.updateSettingsOperation = updateSettingsOperation;
  }

  async get(req, res) {
    const result = await this.getSettingsOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }

  async update(req, res) {
    const result = await this.updateSettingsOperation.execute(req.user.user_id, req.body);
    res.status(200).json(result);
  }
}

module.exports = SettingsController;
