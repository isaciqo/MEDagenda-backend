class ListPatientsOperation {
  constructor({ patientRepository }) {
    this.patientRepository = patientRepository;
  }

  async execute({ doctor_id, search }) {
    const patients = search
      ? await this.patientRepository.searchByName(doctor_id, search)
      : await this.patientRepository.findAll(doctor_id);

    return patients.map(p => ({
      id: p.patient_id,
      name: p.name,
      displayName: p.displayName,
      phone: p.phone,
      notes: p.notes ?? '',
    }));
  }
}

module.exports = ListPatientsOperation;
