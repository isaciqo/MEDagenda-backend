class AvailabilityController {
  constructor({ getAvailabilitySlotsOperation }) {
    this.getAvailabilitySlotsOperation = getAvailabilitySlotsOperation;
  }

  async slots(req, res) {
    const result = await this.getAvailabilitySlotsOperation.execute({
      doctor_id: req.user.user_id,
      from: req.query.from,
      to: req.query.to,
    });
    res.status(200).json(result);
  }
}

module.exports = AvailabilityController;
