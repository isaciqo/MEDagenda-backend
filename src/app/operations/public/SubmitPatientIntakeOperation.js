const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

class SubmitPatientIntakeOperation {
  constructor({ userRepository, patientRepository, auditService }) {
    this.userRepository = userRepository;
    this.patientRepository = patientRepository;
    this.auditService = auditService;
  }

  async execute(code, {
    isThirdParty, patientName, patientBirthDate, patientPhone,
    guardianName, guardianRelationship, guardianPhone,
  }, ip_address) {
    const user = await this.userRepository.findByPatientIntakeCode(code);
    if (!user || !user.consultaEnabled) {
      const error = new Error('Link inválido');
      error.statusCode = 400;
      throw error;
    }

    const doctor_id = user.user_id;
    const name = patientName.trim();

    // Mesma lógica de desambiguação já usada em resolvePatient.js (criação de
    // cliente via consulta) — nunca sobrescreve um cadastro existente, só
    // desambigua o nome. Autocadastro público nunca tenta "casar" com um
    // cliente já existente (diferente do fluxo da Agenda), porque não tem
    // ninguém pra confirmar se é a mesma pessoa ou não.
    const sameNameCount = await this.patientRepository.countByName(doctor_id, name);
    const displayName = sameNameCount === 0 ? name : `${name} (cliente ${sameNameCount + 1})`;

    // O telefone de contato é de quem realmente vai responder no WhatsApp:
    // o representante, quando existe, senão o próprio paciente.
    const phone = isThirdParty ? (guardianPhone || '') : (patientPhone || '');

    const patient = await this.patientRepository.create({
      patient_id: uuidv4(),
      doctor_id,
      name,
      displayName,
      phone,
      birthDate: patientBirthDate || null,
      guardianName: isThirdParty ? guardianName.trim() : null,
      guardianRelationship: isThirdParty ? guardianRelationship.trim() : null,
      consentAcceptedAt: new Date(),
      source: 'self_registration',
    });

    logger.info('patient.self_register: cliente autocadastrado', { doctor_id, patient_id: patient.patient_id });

    try {
      await this.auditService.log({
        actor_id: doctor_id,
        action: 'patient.self_register',
        resource_type: 'patient',
        resource_id: patient.patient_id,
        ip_address,
        metadata: { isThirdParty },
      });
    } catch (err) {
      // Melhor esforço — o cadastro em si já aconteceu, log de auditoria falho
      // não é motivo pra devolver erro pro cliente que acabou de se cadastrar.
      logger.warn('patient.self_register: falha ao registrar auditoria', { doctor_id, error: err.message });
    }

    return {
      name: patient.name,
      doctorName: user.displayName || user.name,
    };
  }
}

module.exports = SubmitPatientIntakeOperation;
