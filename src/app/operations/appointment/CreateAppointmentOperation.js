const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

const EXPIRY_YEARS = parseInt(process.env.APPOINTMENT_EXPIRY_YEARS) || 2;

function getExpiresAt() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + EXPIRY_YEARS);
  return d;
}

class CreateAppointmentOperation {
  constructor({ appointmentRepository, patientRepository, userRepository, planService }) {
    this.appointmentRepository = appointmentRepository;
    this.patientRepository = patientRepository;
    this.userRepository = userRepository;
    this.planService = planService;
  }

  async execute({ doctor_id, patientId, patientName, patientPhone, type, date, time, estimatedValue, notes, location, returnDate, returnTime, returnEstimatedValue, returnIsPaid = true }) {
    // ── Plan enforcement ───────────────────────────────────────────
    const user = await this.userRepository.findById(doctor_id);
    if (user) {
      const now = new Date();
      const monthlyCount = await this.appointmentRepository.countByDoctorAndMonth(
        doctor_id, now.getFullYear(), now.getMonth() + 1
      );
      const newCount = 1 + (returnDate ? 1 : 0);
      this.planService.canCreateAppointment(user, monthlyCount, newCount);
    }
    // ──────────────────────────────────────────────────────────────

    // A11: retorno não pode ser anterior à consulta principal
    if (returnDate && returnDate < date) {
      const error = new Error('A data do retorno deve ser igual ou posterior à data da consulta');
      error.statusCode = 400;
      throw error;
    }

    const patient = await this._resolvePatient({ doctor_id, patientId, patientName, patientPhone });

    const appointmentId = uuidv4();
    const appointment = await this.appointmentRepository.create({
      appointment_id: appointmentId,
      doctor_id,
      patient: {
        id: patient.patient_id,
        name: patient.displayName,
        phone: patient.phone,
      },
      type,
      date,
      time,
      estimatedValue,
      notes: notes || '',
      location: type === 'presencial' ? (location || '') : '',
      status: 'agendado',
      expiresAt: getExpiresAt(),
    });

    logger.info('appointment.create: consulta agendada', {
      doctor_id,
      appointment_id: appointmentId,
      patient_id: patient.patient_id,
      date,
      time,
      type,
    });

    if (returnDate) {
      const returnId = uuidv4();
      await this.appointmentRepository.create({
        appointment_id: returnId,
        doctor_id,
        patient: {
          id: patient.patient_id,
          name: patient.displayName,
          phone: patient.phone,
        },
        type,
        date: returnDate,
        time: returnTime || time,
        estimatedValue: returnIsPaid ? (returnEstimatedValue ?? estimatedValue) : 0,
        notes: '',
        location: type === 'presencial' ? (location || '') : '',
        status: 'agendado',
        isReturn: true,
        returnOf: appointmentId,
        expiresAt: getExpiresAt(),
      });

      logger.info('appointment.create: retorno agendado', {
        doctor_id,
        appointment_id: returnId,
        return_of: appointmentId,
        date: returnDate,
      });
    }

    return this._format(appointment);
  }

  async _resolvePatient({ doctor_id, patientId, patientName, patientPhone }) {
    if (patientId) {
      const found = await this.patientRepository.findById(patientId);
      if (found) return found;
    }

    if (patientPhone) {
      const byPhone = await this.patientRepository.findByPhone(doctor_id, patientPhone);
      if (byPhone) return byPhone;
    }

    // A12: busca case-insensitive para evitar duplicatas por variação de maiúsculas
    const byName = await this.patientRepository.findByExactName(doctor_id, patientName);
    if (byName) return byName;

    const sameNameCount = await this.patientRepository.countByName(doctor_id, patientName);
    const displayName = sameNameCount === 0 ? patientName : `${patientName} (paciente ${sameNameCount + 1})`;

    return await this.patientRepository.create({
      patient_id: uuidv4(),
      doctor_id,
      name: patientName,
      phone: patientPhone || '',
      displayName,
    });
  }

  _format(a) {
    return {
      id: a.appointment_id,
      patient: a.patient,
      type: a.type,
      date: a.date,
      time: a.time,
      estimatedValue: a.estimatedValue,
      paidValue: a.paidValue,
      paymentMethod: a.paymentMethod,
      paymentDate: a.paymentDate,
      status: a.status,
      notes: a.notes,
      location: a.location || '',
      isReturn: a.isReturn ?? false,
      returnOf: a.returnOf ?? null,
      seriesId: a.seriesId ?? null,
      seriesIndex: a.seriesIndex ?? null,
      seriesTotalSessions: a.seriesTotalSessions ?? null,
    };
  }
}

module.exports = CreateAppointmentOperation;
