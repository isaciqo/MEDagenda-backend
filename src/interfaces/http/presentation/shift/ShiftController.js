class ShiftController {
  constructor({
    createShiftOperation,
    listShiftsOperation,
    getShiftOperation,
    updateShiftOperation,
    deleteShiftOperation,
    cancelShiftOperation,
    realizeShiftOperation,
    createShiftSeriesOperation,
    deleteShiftSeriesOperation,
    updateShiftSeriesOperation,
    auditService,
  }) {
    this.createShiftOperation = createShiftOperation;
    this.listShiftsOperation = listShiftsOperation;
    this.getShiftOperation = getShiftOperation;
    this.updateShiftOperation = updateShiftOperation;
    this.deleteShiftOperation = deleteShiftOperation;
    this.cancelShiftOperation = cancelShiftOperation;
    this.realizeShiftOperation = realizeShiftOperation;
    this.createShiftSeriesOperation = createShiftSeriesOperation;
    this.deleteShiftSeriesOperation = deleteShiftSeriesOperation;
    this.updateShiftSeriesOperation = updateShiftSeriesOperation;
    this.auditService = auditService;
  }

  async create(req, res) {
    const result = await this.createShiftOperation.execute({
      doctor_id: req.user.user_id,
      ...req.body,
    });
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'shift.create',
      resource_type: 'shift',
      resource_id: result.id,
      ip_address: req.ip,
    });
    res.status(201).json(result);
  }

  async list(req, res) {
    const result = await this.listShiftsOperation.execute({
      doctor_id: req.user.user_id,
      date: req.query.date,
      status: req.query.status,
      from: req.query.from,
      to: req.query.to,
    });
    res.status(200).json(result);
  }

  async getById(req, res) {
    const result = await this.getShiftOperation.execute(req.params.id, req.user.user_id);
    res.status(200).json(result);
  }

  async update(req, res) {
    const result = await this.updateShiftOperation.execute(req.params.id, req.user.user_id, req.body);
    res.status(200).json(result);
  }

  async delete(req, res) {
    const result = await this.deleteShiftOperation.execute(req.params.id, req.user.user_id);
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'shift.delete',
      resource_type: 'shift',
      resource_id: req.params.id,
      ip_address: req.ip,
    });
    res.status(200).json(result);
  }

  async cancel(req, res) {
    const result = await this.cancelShiftOperation.execute(req.params.id, req.user.user_id);
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'shift.cancel',
      resource_type: 'shift',
      resource_id: req.params.id,
      ip_address: req.ip,
    });
    res.status(200).json(result);
  }

  async realize(req, res) {
    const result = await this.realizeShiftOperation.execute(req.params.id, req.user.user_id, req.body);
    res.status(200).json(result);
  }

  async createSeries(req, res) {
    const result = await this.createShiftSeriesOperation.execute({
      doctor_id: req.user.user_id,
      ...req.body,
    });
    res.status(201).json(result);
  }

  async deleteSeries(req, res) {
    const result = await this.deleteShiftSeriesOperation.execute({
      doctor_id: req.user.user_id,
      seriesId: req.params.seriesId,
      fromDate: req.query.from,
    });
    res.status(200).json(result);
  }

  async updateSeries(req, res) {
    const result = await this.updateShiftSeriesOperation.execute({
      doctor_id: req.user.user_id,
      seriesId: req.params.seriesId,
      fromDate: req.query.from,
      data: req.body,
    });
    res.status(200).json(result);
  }
}

module.exports = ShiftController;
