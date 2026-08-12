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
    const realized = appointments.filter(a => a.status === 'realizado');

    // Snapshot de backup ANTES de anonimizar — não vai pra lugar nenhum
    // visível no produto (não aparece em nenhuma tela), fica só no audit log
    // (que já expira sozinho em 1 ano) pra ter como recuperar/conferir depois
    // se algum dia precisar, sem deixar o dado exposto no dia a dia do app.
    const backupSnapshot = {
      patient: { name: existing.name, phone: existing.phone },
      realizedAppointments: realized.map(a => ({
        appointment_id: a.appointment_id,
        date: a.date,
        time: a.time,
        notes: a.notes || null,
      })),
    };

    // Consultas que nunca aconteceram (ou foram canceladas) não têm valor
    // histórico — apaga de verdade, evita "fantasma" sem contato na agenda.
    await this.appointmentRepository.deleteNonRealizedByPatientId(patient_id);

    // Consultas realizadas alimentam Financeiro — anonimiza em vez de apagar,
    // preservando o histórico de faturamento do médico. Satisfaz o direito ao
    // esquecimento (LGPD Art. 18º VI) via anonimização (Art. 12), não por
    // destruição do registro. Avaliações (nome do paciente na tela de
    // Avaliações) ficam como estão — decisão consciente do médico de manter.
    await this.appointmentRepository.anonymizeRealizedByPatientId(patient_id);

    await this.patientRepository.delete(patient_id);

    logger.info('patient.delete: cadastro removido, histórico realizado anonimizado', {
      patient_id,
      appointments_realized_anonymized: realized.length,
      appointments_non_realized_deleted: appointments.length - realized.length,
    });

    return {
      message: 'Paciente removido. O histórico de consultas realizadas continua nos seus relatórios, sem nome ou telefone associado.',
      backupSnapshot,
    };
  }
}

module.exports = DeletePatientOperation;
