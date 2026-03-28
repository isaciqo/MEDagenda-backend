class PublicController {
  constructor({
    confirmByTokenOperation,
    getPublicSlotsOperation,
    rescheduleByTokenOperation,
    getAppointmentByTokenOperation,
    createReviewOperation,
  }) {
    this.confirmByTokenOperation = confirmByTokenOperation;
    this.getPublicSlotsOperation = getPublicSlotsOperation;
    this.rescheduleByTokenOperation = rescheduleByTokenOperation;
    this.getAppointmentByTokenOperation = getAppointmentByTokenOperation;
    this.createReviewOperation = createReviewOperation;
  }

  async confirm(req, res) {
    const result = await this.confirmByTokenOperation.execute(req.params.token);
    res.status(200).json(result);
  }

  async slots(req, res) {
    const result = await this.getPublicSlotsOperation.execute(req.params.token);
    res.status(200).json(result);
  }

  async reschedule(req, res) {
    const result = await this.rescheduleByTokenOperation.execute(req.params.token, req.body);
    res.status(200).json(result);
  }

  async reviewInfo(req, res) {
    const result = await this.getAppointmentByTokenOperation.execute(req.params.token);
    res.status(200).json(result);
  }

  async submitReview(req, res) {
    const info = await this.getAppointmentByTokenOperation.execute(req.params.token);
    const result = await this.createReviewOperation.execute({
      appointmentId: info.appointmentId,
      patientName: req.body.patientName,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    res.status(201).json(result);
  }
}

module.exports = PublicController;
