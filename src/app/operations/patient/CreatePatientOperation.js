const { v4: uuidv4 } = require('uuid');

class CreatePatientOperation {
  constructor({ patientRepository }) {
    this.patientRepository = patientRepository;
  }

  async execute({ doctor_id, name, phone }) {
    // Se já existe paciente com mesmo telefone, retorna ele
    const byPhone = await this.patientRepository.findByPhone(doctor_id, phone);
    if (byPhone) {
      const error = new Error('Já existe um paciente com este telefone');
      error.statusCode = 409;
      throw error;
    }

    // Conta quantos pacientes já têm o mesmo nome para gerar displayName único
    const sameNameCount = await this.patientRepository.countByName(doctor_id, name);
    const displayName = sameNameCount === 0 ? name : `${name} (paciente ${sameNameCount + 1})`;

    const patient = await this.patientRepository.create({
      patient_id: uuidv4(),
      doctor_id,
      name,
      phone,
      displayName,
    });

    return this._format(patient);
  }

  _format(p) {
    return {
      id: p.patient_id,
      name: p.name,
      displayName: p.displayName,
      phone: p.phone,
    };
  }
}

module.exports = CreatePatientOperation;
