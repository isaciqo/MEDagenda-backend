const logger = require('../../../lib/logger');

class DeletePatientOperation {
  constructor({ patientRepository, appointmentRepository, reviewRepository }) {
    this.patientRepository = patientRepository;
    this.appointmentRepository = appointmentRepository;
    this.reviewRepository = reviewRepository;
  }

  async execute(patient_id, doctor_id) {
    const existing = await this.patientRepository.findById(patient_id);
    if (!existing) {
      logger.warn('patient.delete: paciente não encontrado', { patient_id });
      const error = new Error('Paciente não encontrado');
      error.statusCode = 404;
      throw error;
    }
    if (existing.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    const appointments = await this.appointmentRepository.findByPatientId(patient_id);
    const appointmentIds = appointments.map(a => a.appointment_id);

    await this.reviewRepository.deleteByAppointmentIds(appointmentIds);
    await this.appointmentRepository.deleteByPatientId(patient_id);
    await this.patientRepository.delete(patient_id);

    logger.info('patient.delete: paciente e dados vinculados removidos', {
      patient_id,
      appointments_deleted: appointmentIds.length,
    });

    return { message: 'Paciente e todos os dados vinculados removidos com sucesso' };
  }
}

module.exports = DeletePatientOperation;
