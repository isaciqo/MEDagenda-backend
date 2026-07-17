const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

class CreatePatientOperation {
  constructor({ patientRepository }) {
    this.patientRepository = patientRepository;
  }

  async execute({ doctor_id, name, phone }) {
    const byPhone = await this.patientRepository.findByPhone(doctor_id, phone);
    if (byPhone) {
      logger.warn('patient.create: telefone já cadastrado', { doctor_id, phone });
      const error = new Error('Já existe um cliente com este telefone');
      error.statusCode = 409;
      throw error;
    }

    const sameNameCount = await this.patientRepository.countByName(doctor_id, name);
    const displayName = sameNameCount === 0 ? name : `${name} (cliente ${sameNameCount + 1})`;

    const patient = await this.patientRepository.create({
      patient_id: uuidv4(),
      doctor_id,
      name,
      phone,
      displayName,
    });

    logger.info('patient.create: paciente criado', { doctor_id, patient_id: patient.patient_id, name });
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
