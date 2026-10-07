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
    getCancellationSurveyInfoOperation,
    submitCancellationSurveyOperation,
    getPatientIntakeInfoOperation,
    submitPatientIntakeOperation,
    getPublicBookingInfoOperation,
    getPublicBookingSlotsOperation,
    requestPublicBookingOperation,
  }) {
    this.confirmByIdOperation = confirmByIdOperation;
    this.getPublicSlotsOperation = getPublicSlotsOperation;
    this.rescheduleByTokenOperation = rescheduleByTokenOperation;
    this.getReviewInfoByLinkOperation = getReviewInfoByLinkOperation;
    this.submitReviewByLinkOperation = submitReviewByLinkOperation;
    this.getPublicAppointmentInfoOperation = getPublicAppointmentInfoOperation;
    this.getPublicWeekScheduleOperation = getPublicWeekScheduleOperation;
    this.requestRescheduleByTokenOperation = requestRescheduleByTokenOperation;
    this.getCancellationSurveyInfoOperation = getCancellationSurveyInfoOperation;
    this.submitCancellationSurveyOperation = submitCancellationSurveyOperation;
    this.getPatientIntakeInfoOperation = getPatientIntakeInfoOperation;
    this.submitPatientIntakeOperation = submitPatientIntakeOperation;
    this.getPublicBookingInfoOperation = getPublicBookingInfoOperation;
    this.getPublicBookingSlotsOperation = getPublicBookingSlotsOperation;
    this.requestPublicBookingOperation = requestPublicBookingOperation;
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

  async cancellationSurveyInfo(req, res) {
    const result = await this.getCancellationSurveyInfoOperation.execute(req.params.id);
    res.status(200).json(result);
  }

  async submitCancellationSurvey(req, res) {
    const result = await this.submitCancellationSurveyOperation.execute(req.params.id, req.body);
    res.status(200).json(result);
  }

  async patientIntakeInfo(req, res) {
    const result = await this.getPatientIntakeInfoOperation.execute(req.params.code);
    res.status(200).json(result);
  }

  async submitPatientIntake(req, res) {
    const result = await this.submitPatientIntakeOperation.execute(req.params.code, req.body, req.ip);
    res.status(201).json(result);
  }

  async bookingInfo(req, res) {
    const result = await this.getPublicBookingInfoOperation.execute(req.params.code);
    res.status(200).json(result);
  }

  async bookingSlots(req, res) {
    const result = await this.getPublicBookingSlotsOperation.execute(req.params.code);
    res.status(200).json(result);
  }

  async requestBooking(req, res) {
    const result = await this.requestPublicBookingOperation.execute(req.params.code, req.body);
    res.status(201).json(result);
  }
}

module.exports = PublicController;
