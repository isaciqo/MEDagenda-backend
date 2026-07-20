class PatientController {
  constructor({
    createPatientOperation,
    listPatientsOperation,
    updatePatientOperation,
    deletePatientOperation,
    exportPatientDataOperation,
    auditService,
  }) {
    this.createPatientOperation = createPatientOperation;
    this.listPatientsOperation = listPatientsOperation;
    this.updatePatientOperation = updatePatientOperation;
    this.deletePatientOperation = deletePatientOperation;
    this.exportPatientDataOperation = exportPatientDataOperation;
    this.auditService = auditService;
  }

  async create(req, res) {
    const result = await this.createPatientOperation.execute({
      doctor_id: req.user.user_id,
      ...req.body,
    });
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'patient.create',
      resource_type: 'patient',
      resource_id: result.id,
      ip_address: req.ip,
    });
    res.status(201).json(result);
  }

  async list(req, res) {
    const result = await this.listPatientsOperation.execute({
      doctor_id: req.user.user_id,
      search: req.query.search,
    });
    res.status(200).json(result);
  }

  async update(req, res) {
    const result = await this.updatePatientOperation.execute(
      req.params.patient_id,
      req.body,
      req.user.user_id,
    );
    res.status(200).json(result);
  }

  async delete(req, res) {
    const result = await this.deletePatientOperation.execute(
      req.params.patient_id,
      req.user.user_id,
    );
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'patient.delete',
      resource_type: 'patient',
      resource_id: req.params.patient_id,
      ip_address: req.ip,
    });
    res.status(200).json(result);
  }

  async exportData(req, res) {
    const result = await this.exportPatientDataOperation.execute(req.params.patient_id, req.user.user_id);
    await this.auditService.log({
      actor_id: req.user.user_id,
      action: 'patient.export',
      resource_type: 'patient',
      resource_id: req.params.patient_id,
      ip_address: req.ip,
    });
    res.status(200).json(result);
  }
}

module.exports = PatientController;
