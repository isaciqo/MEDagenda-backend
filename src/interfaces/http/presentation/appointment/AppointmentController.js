class AppointmentController {
  constructor({
    createAppointmentOperation,
    listAppointmentsOperation,
    getAppointmentOperation,
    cancelAppointmentOperation,
    confirmAppointmentOperation,
    realizeAppointmentOperation,
    getReturnLinkOperation,
    generateAppointmentLinksOperation,
  }) {
    this.createAppointmentOperation = createAppointmentOperation;
    this.listAppointmentsOperation = listAppointmentsOperation;
    this.getAppointmentOperation = getAppointmentOperation;
    this.cancelAppointmentOperation = cancelAppointmentOperation;
    this.confirmAppointmentOperation = confirmAppointmentOperation;
    this.realizeAppointmentOperation = realizeAppointmentOperation;
    this.getReturnLinkOperation = getReturnLinkOperation;
    this.generateAppointmentLinksOperation = generateAppointmentLinksOperation;
  }

  async create(req, res) {
    const result = await this.createAppointmentOperation.execute({
      doctor_id: req.user.user_id,
      ...req.body,
    });
    res.status(201).json(result);
  }

  async list(req, res) {
    const result = await this.listAppointmentsOperation.execute({
      doctor_id: req.user.user_id,
      date: req.query.date,
      status: req.query.status,
    });
    res.status(200).json(result);
  }

  async getById(req, res) {
    const result = await this.getAppointmentOperation.execute(req.params.id);
    res.status(200).json(result);
  }

  async cancel(req, res) {
    const result = await this.cancelAppointmentOperation.execute(req.params.id);
    res.status(200).json(result);
  }

  async confirm(req, res) {
    const result = await this.confirmAppointmentOperation.execute(req.params.id);
    res.status(200).json(result);
  }

  async realize(req, res) {
    const result = await this.realizeAppointmentOperation.execute(req.params.id, req.body);
    res.status(200).json(result);
  }

  async returnLink(req, res) {
    const result = await this.getReturnLinkOperation.execute(req.params.id, req.body);
    res.status(200).json(result);
  }

  async generateLinks(req, res) {
    const result = await this.generateAppointmentLinksOperation.execute(req.params.id);
    res.status(200).json(result);
  }
}

module.exports = AppointmentController;
