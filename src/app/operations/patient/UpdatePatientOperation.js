class UpdatePatientOperation {
  constructor({ patientRepository }) {
    this.patientRepository = patientRepository;
  }

  async execute(patient_id, { name, phone }) {
    const existing = await this.patientRepository.findById(patient_id);
    if (!existing) {
      const error = new Error('Paciente não encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (phone && phone !== existing.phone) {
      const byPhone = await this.patientRepository.findByPhone(existing.doctor_id, phone);
      if (byPhone) {
        const error = new Error('Já existe um paciente com este telefone');
        error.statusCode = 409;
        throw error;
      }
    }

    const updateData = {};
    if (phone) updateData.phone = phone;

    if (name && name !== existing.name) {
      const sameNameCount = await this.patientRepository.countByName(existing.doctor_id, name);
      updateData.name = name;
      updateData.displayName = sameNameCount === 0 ? name : `${name} (paciente ${sameNameCount + 1})`;
    }

    const updated = await this.patientRepository.update(patient_id, updateData);

    return {
      id: updated.patient_id,
      name: updated.name,
      displayName: updated.displayName,
      phone: updated.phone,
    };
  }
}

module.exports = UpdatePatientOperation;
