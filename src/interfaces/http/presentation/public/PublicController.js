class PublicController {
  constructor({
    confirmByIdOperation,
    getPublicSlotsOperation,
    rescheduleByTokenOperation,
    getReviewInfoByLinkOperation,
    submitReviewByLinkOperation,
  }) {
    this.confirmByIdOperation = confirmByIdOperation;
    this.getPublicSlotsOperation = getPublicSlotsOperation;
    this.rescheduleByTokenOperation = rescheduleByTokenOperation;
    this.getReviewInfoByLinkOperation = getReviewInfoByLinkOperation;
    this.submitReviewByLinkOperation = submitReviewByLinkOperation;
  }

  async confirm(req, res) {
    const result = await this.confirmByIdOperation.execute(req.params.appointmentId);
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
