class PublicController {
  constructor({
    confirmByIdOperation,
    getPublicSlotsOperation,
    rescheduleByTokenOperation,
    getReviewInfoByLinkOperation,
    submitReviewByLinkOperation,
    getPublicAppointmentInfoOperation,
    getPublicWeekScheduleOperation,
    requestRescheduleByTokenOperation,
  }) {
    this.confirmByIdOperation = confirmByIdOperation;
    this.getPublicSlotsOperation = getPublicSlotsOperation;
    this.rescheduleByTokenOperation = rescheduleByTokenOperation;
    this.getReviewInfoByLinkOperation = getReviewInfoByLinkOperation;
    this.submitReviewByLinkOperation = submitReviewByLinkOperation;
    this.getPublicAppointmentInfoOperation = getPublicAppointmentInfoOperation;
    this.getPublicWeekScheduleOperation = getPublicWeekScheduleOperation;
    this.requestRescheduleByTokenOperation = requestRescheduleByTokenOperation;
  }

  async appointmentInfo(req, res) {
    const result = await this.getPublicAppointmentInfoOperation.execute(req.params.token);
    res.status(200).json(result);
  }

  async weekSchedule(req, res) {
    const result = await this.getPublicWeekScheduleOperation.execute(req.params.token);
    res.status(200).json(result);
  }

  async requestReschedule(req, res) {
    const result = await this.requestRescheduleByTokenOperation.execute(req.params.token, req.body);
    res.status(200).json(result);
  }

  async confirm(req, res) {
    const result = await this.confirmByIdOperation.execute(req.params.token);
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
    const result = await this.getReviewInfoByLinkOperation.execute(req.params.linkId);
    res.status(200).json(result);
  }

  async submitReview(req, res) {
    const result = await this.submitReviewByLinkOperation.execute(req.params.linkId, req.body);
    res.status(201).json(result);
  }
}

module.exports = PublicController;
