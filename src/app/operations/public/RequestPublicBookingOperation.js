const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

const EXPIRY_YEARS = parseInt(process.env.APPOINTMENT_EXPIRY_YEARS) || 2;

function getExpiresAt() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + EXPIRY_YEARS);
  return d;
}

// Cria consulta a partir da página pública de agendamento — diferente de
// CreateAppointmentOperation (uso autenticado do médico): aqui quem preenche é
// um estranho sem conta. Reaproveita um cliente já existente só quando o
// telefone bate (mesma pessoa preenchendo de novo) — nunca por nome sozinho,
// que dá pra digitar igual ao de outra pessoa num formulário público sem
// verificação nenhuma. Sem telefone informado, não tem como confirmar que é a
// mesma pessoa, então cria um cliente novo (com a mesma desambiguação de nome
// do SubmitPatientIntakeOperation). O status final depende de publicBookingAutoAccept.
class RequestPublicBookingOperation {
  constructor({ userRepository, patientRepository, appointmentRepository, blockedPeriodRepository, scheduleService }) {
    this.userRepository = userRepository;
    this.patientRepository = patientRepository;
    this.appointmentRepository = appointmentRepository;
    this.blockedPeriodRepository = blockedPeriodRepository;
    this.scheduleService = scheduleService;
  }

  async execute(code, { patientName, patientPhone, date, time }) {
    const doctor = await this.userRepository.findByPublicBookingCode(code);
    if (!doctor || !doctor.publicBookingEnabled) {
      const error = new Error('Link inválido ou agendamento público desativado');
      error.statusCode = 400;
      throw error;
    }

    const doctor_id = doctor.user_id;
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      const error = new Error('A data solicitada deve ser futura');
      error.statusCode = 400;
      throw error;
    }

    const duration = doctor.publicBookingDuration || doctor.defaultDuration || 30;

    if (!this.scheduleService.isSlotOpen(doctor.schedule, date, time)) {
      const error = new Error('Esse horário está fora do expediente. Escolha outro.');
      error.statusCode = 400;
      throw error;
    }

    const dayAppointments = await this.appointmentRepository.findByDoctorAndDateRange(doctor_id, date, date);
    if (this.scheduleService.hasOverlap(dayAppointments, date, time, duration)) {
      const error = new Error('Esse horário já está ocupado. Escolha outro.');
      error.statusCode = 409;
      throw error;
    }

    const dayBlocks = await this.blockedPeriodRepository.findByDoctorAndDateRange(doctor_id, date, date);
    if (this.scheduleService.isBlocked(dayBlocks, date, time, duration)) {
      const error = new Error('Esse horário não está disponível. Escolha outro.');
      error.statusCode = 409;
      throw error;
    }

    const name = patientName.trim();
    const phone = patientPhone || '';

    let patient = phone ? await this.patientRepository.findByPhone(doctor_id, phone) : null;

    if (!patient) {
      const sameNameCount = await this.patientRepository.countByName(doctor_id, name);
      const displayName = sameNameCount === 0 ? name : `${name} (cliente ${sameNameCount + 1})`;

      patient = await this.patientRepository.create({
        patient_id: uuidv4(),
        doctor_id,
        name,
        displayName,
        phone,
        source: 'public_booking',
      });
    }

    const status = doctor.publicBookingAutoAccept ? 'agendado' : 'aguardando_confirmacao';

    const appointment = await this.appointmentRepository.create({
      appointment_id: uuidv4(),
      doctor_id,
      patient: {
        id: patient.patient_id,
        name: patient.displayName,
        phone: patient.phone,
      },
      type: 'presencial',
      date,
      time,
      estimatedValue: doctor.defaultConsultationValue || 0,
      status,
      expiresAt: getExpiresAt(),
    });

    logger.info('appointment.public_booking_request', {
      doctor_id, appointment_id: appointment.appointment_id, status, date, time,
    });

    return {
      patientName: patient.name,
      doctorName: doctor.displayName || doctor.name,
      date,
      time,
      autoAccepted: doctor.publicBookingAutoAccept,
    };
  }
}

module.exports = RequestPublicBookingOperation;
