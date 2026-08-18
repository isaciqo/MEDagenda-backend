class AppointmentController {
  constructor({
    createAppointmentOperation,
    listAppointmentsOperation,
    getAppointmentOperation,
    cancelAppointmentOperation,
    confirmAppointmentOperation,
    realizeAppointmentOperation,
    updateAppointmentOperation,
    deleteAppointmentOperation,
    getReturnLinkOperation,
    generateAppointmentLinksOperation,
    createAppointmentSeriesOperation,
    deleteAppointmentSeriesOperation,
    updateAppointmentSeriesOperation,
    acceptRescheduleRequestOperation,
    declineRescheduleRequestOperation,
    auditService,
  }) {
    this.createAppointmentOperation = createAppointmentOperation;
    this.listAppointmentsOperation = listAppointmentsOperation;
    this.getAppointmentOperation = getAppointmentOperation;
    this.cancelAppointmentOperation = cancelAppointmentOperation;
    this.confirmAppointmentOperation = confirmAppointmentOperation;
    this.realizeAppointmentOperation = realizeAppointmentOperation;
    this.updateAppointmentOperation = updateAppointmentOperation;
    this.deleteAppointmentOperation = deleteAppointmentOperation;
    this.getReturnLinkOperation = getReturnLinkOperation;
    this.generateAppointmentLinksOperation = generateAppointmentLinksOperation;
    this.createAppointmentSeriesOperation = createAppointmentSeriesOperation;
    this.deleteAppointmentSeriesOperation = deleteAppointmentSeriesOperation;
    this.updateAppointmentSeriesOperation = updateAppointmentSeriesOperation;
    this.acceptRescheduleRequestOperation = acceptRescheduleRequestOperation;
    this.declineRescheduleRequestOperation = declineRescheduleRequestOperation;
    this.auditService = auditService;
  }

  async create(req, res) {
    const result = await this.createAppointmentOperation.execute({
      doctor_id: req.user.user_id,
      ...req.body,
    });
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'appointment.create',
      resource_type: 'appointment',
      resource_id: result.id,
      ip_address: req.ip,
    });
    res.status(201).json(result);
  }

  async list(req, res) {
    const result = await this.listAppointmentsOperation.execute({
      doctor_id: req.user.user_id,
      date: req.query.date,
      status: req.query.status,
      from: req.query.from,
      to: req.query.to,
    });
    res.status(200).json(result);
  }

  async getById(req, res) {
    const result = await this.getAppointmentOperation.execute(req.params.id, req.user.user_id);
    res.status(200).json(result);
  }

  async cancel(req, res) {
    const result = await this.cancelAppointmentOperation.execute(req.params.id, req.user.user_id);
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'appointment.cancel',
      resource_type: 'appointment',
      resource_id: req.params.id,
      ip_address: req.ip,
    });
    res.status(200).json(result);
  }

  async confirm(req, res) {
    const result = await this.confirmAppointmentOperation.execute(req.params.id);
    res.status(200).json(result);
  }

  async realize(req, res) {
    const result = await this.realizeAppointmentOperation.execute(req.params.id, req.user.user_id, req.body);
    res.status(200).json(result);
  }

  async delete(req, res) {
    const result = await this.deleteAppointmentOperation.execute(req.params.id, req.user.user_id);
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'appointment.delete',
      resource_type: 'appointment',
      resource_id: req.params.id,
      ip_address: req.ip,
    });
    res.status(200).json(result);
  }

  async update(req, res) {
    const result = await this.updateAppointmentOperation.execute(req.params.id, req.user.user_id, req.body);
    res.status(200).json(result);
  }

  async returnLink(req, res) {
    const result = await this.getReturnLinkOperation.execute(req.params.id, req.body);
    res.status(200).json(result);
  }

  async generateLinks(req, res) {
    const result = await this.generateAppointmentLinksOperation.execute(req.params.id, req.user.user_id);
    res.status(200).json(result);
  }

  async createSeries(req, res) {
    const result = await this.createAppointmentSeriesOperation.execute({
      doctor_id: req.user.user_id,
      ...req.body,
    });
    res.status(201).json(result);
  }

  async deleteSeries(req, res) {
    const result = await this.deleteAppointmentSeriesOperation.execute({
      doctor_id: req.user.user_id,
      seriesId: req.params.seriesId,
      fromDate: req.query.from,
    });
    res.status(200).json(result);
  }

  async updateSeries(req, res) {
    const result = await this.updateAppointmentSeriesOperation.execute({
      doctor_id: req.user.user_id,
      seriesId: req.params.seriesId,
      fromDate: req.query.from,
      data: req.body,
    });
    res.status(200).json(result);
  }

  async acceptRescheduleRequest(req, res) {
    const result = await this.acceptRescheduleRequestOperation.execute(req.params.id, req.user.user_id);
    res.status(200).json(result);
  }

  async declineRescheduleRequest(req, res) {
    const result = await this.declineRescheduleRequestOperation.execute(req.params.id, req.user.user_id);
    res.status(200).json(result);
  }
}

module.exports = AppointmentController;
