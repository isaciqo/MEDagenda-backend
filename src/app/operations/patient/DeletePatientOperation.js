class DeletePatientOperation {
  constructor({ patientRepository }) {
    this.patientRepository = patientRepository;
  }

  async execute(patient_id) {
    const existing = await this.patientRepository.findById(patient_id);
    if (!existing) {
      const error = new Error('Paciente não encontrado');
      error.statusCode = 404;
      throw error;
    }

    await this.patientRepository.delete(patient_id);
    return { message: 'Paciente removido com sucesso' };
  }
}

module.exports = DeletePatientOperation;
