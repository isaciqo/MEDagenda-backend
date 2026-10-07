class SettingsController {
  constructor({
    getSettingsOperation,
    updateSettingsOperation,
    getSavedLocationsOperation,
    getPublicBookingLinkOperation,
    regeneratePublicBookingLinkOperation,
  }) {
    this.getSettingsOperation = getSettingsOperation;
    this.updateSettingsOperation = updateSettingsOperation;
    this.getSavedLocationsOperation = getSavedLocationsOperation;
    this.getPublicBookingLinkOperation = getPublicBookingLinkOperation;
    this.regeneratePublicBookingLinkOperation = regeneratePublicBookingLinkOperation;
  }

  async get(req, res) {
    const result = await this.getSettingsOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }

  async update(req, res) {
    const result = await this.updateSettingsOperation.execute(req.user.user_id, req.body);
    res.status(200).json(result);
  }

  async locations(req, res) {
    const result = await this.getSavedLocationsOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }

  async getBookingLink(req, res) {
    const result = await this.getPublicBookingLinkOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }

  async regenerateBookingLink(req, res) {
    const result = await this.regeneratePublicBookingLinkOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }
}

module.exports = SettingsController;
