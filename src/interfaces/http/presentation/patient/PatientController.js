class PatientController {
  constructor({
    createPatientOperation,
    listPatientsOperation,
    updatePatientOperation,
    deletePatientOperation,
  }) {
    this.createPatientOperation = createPatientOperation;
    this.listPatientsOperation = listPatientsOperation;
    this.updatePatientOperation = updatePatientOperation;
    this.deletePatientOperation = deletePatientOperation;
  }

  async create(req, res) {
    const result = await this.createPatientOperation.execute({
      doctor_id: req.user.user_id,
      ...req.body,
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
    const result = await this.updatePatientOperation.execute(req.params.patient_id, req.body);
    res.status(200).json(result);
  }

  async delete(req, res) {
    const result = await this.deletePatientOperation.execute(req.params.patient_id);
    res.status(200).json(result);
  }
}

module.exports = PatientController;
