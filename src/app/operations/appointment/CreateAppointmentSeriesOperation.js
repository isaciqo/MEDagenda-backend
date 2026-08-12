const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

const EXPIRY_YEARS = parseInt(process.env.APPOINTMENT_EXPIRY_YEARS) || 2;

function getExpiresAt() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + EXPIRY_YEARS);
  return d;
}

function generateSeriesDates(startDate, frequency) {
  const dates = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(start);
  end.setMonth(end.getMonth() + 2);

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    if (frequency === 'weekly') current.setDate(current.getDate() + 7);
    else if (frequency === 'biweekly') current.setDate(current.getDate() + 14);
    else current.setMonth(current.getMonth() + 1);
  }
  return dates;
}

class CreateAppointmentSeriesOperation {
  constructor({ appointmentRepository, patientRepository, userRepository, planService, scheduleService }) {
    this.appointmentRepository = appointmentRepository;
    this.patientRepository = patientRepository;
    this.userRepository = userRepository;
    this.planService = planService;
    this.scheduleService = scheduleService;
  }

  async execute({ doctor_id, patientId, patientName, patientPhone, type, date, time, estimatedValue, notes, location, recurrence }) {
    const { frequency } = recurrence;
    const dates = generateSeriesDates(date, frequency);
    const totalSessions = dates.length;

    const user = await this.userRepository.findById(doctor_id);
    if (user) {
      const now = new Date();
      const monthlyCount = await this.appointmentRepository.countByDoctorAndMonth(
        doctor_id, now.getFullYear(), now.getMonth() + 1
      );
      this.planService.canCreateAppointment(user, monthlyCount, totalSessions);
    }

    const patient = await this._resolvePatient({ doctor_id, patientId, patientName, patientPhone });

    const defaultDuration = user?.defaultDuration ?? 30;
    const schedule = user?.schedule;

    // O fim da janela de busca precisa cobrir o máximo que uma sessão pode ser empurrada
    // pra frente ao pular um dia fechado (findNextEnabledDate anda até 14 dias) — senão
    // a checagem de conflito de horário fica cega pra agendamentos que já existem logo
    // depois da última data-âncora da série.
    const lastAnchorDate = new Date(dates[dates.length - 1] + 'T00:00:00');
    lastAnchorDate.setDate(lastAnchorDate.getDate() + 14);

    const existingAppointments = await this.appointmentRepository.findAll({
      doctor_id,
      from: date,
      to: lastAnchorDate.toISOString().split('T')[0],
    });

    const seriesId = uuidv4();
    const sessions = [];

    for (let i = 0; i < dates.length; i++) {
      const anchorDate = dates[i];
      let sessionDate = anchorDate;
      let sessionTime = time;
      let sessionStatus = 'ok';
      let originalDate;
      let originalTime;

      // Dia da semana fechado na agenda do médico (ex: recorrência mensal caindo num
      // domingo) — pula pro próximo dia habilitado, sem mexer na âncora das próximas
      // sessões, que continuam calculadas a partir de `date` original.
      if (!this.scheduleService.isDayEnabled(schedule, sessionDate)) {
        const nextEnabled = this.scheduleService.findNextEnabledDate(schedule, sessionDate);
        if (nextEnabled) {
          originalDate = sessionDate;
          sessionDate = nextEnabled;
          sessionStatus = 'adjusted';
        } else {
          sessionStatus = 'conflict';
        }
      }

      if (sessionStatus !== 'conflict') {
        const conflict = existingAppointments.find(
          a => a.date === sessionDate && a.time === sessionTime && a.status !== 'cancelado'
        );
        if (conflict) {
          const adjustedTime = this.scheduleService.findNextFreeTime(existingAppointments, sessionDate, sessionTime, defaultDuration, schedule);
          if (adjustedTime !== sessionTime) {
            originalTime = sessionTime;
            sessionTime = adjustedTime;
            sessionStatus = 'adjusted';
          } else {
            sessionStatus = 'conflict';
          }
        }
      }

      const sessionRecord = { appointmentId: null, date: sessionDate, time: sessionTime, status: sessionStatus };
      if (originalDate) sessionRecord.originalDate = originalDate;
      if (originalTime) sessionRecord.originalTime = originalTime;
      sessions.push(sessionRecord);

      const appointmentId = uuidv4();
      sessions[i].appointmentId = appointmentId;

      const doc = await this.appointmentRepository.create({
        appointment_id: appointmentId,
        doctor_id,
        patient: { id: patient.patient_id, name: patient.displayName, phone: patient.phone },
        type,
        date: sessionDate,
        time: sessionTime,
        estimatedValue,
        notes: notes || '',
        location: type === 'presencial' ? (location || '') : '',
        status: 'agendado',
        seriesId,
        seriesIndex: i,
        seriesTotalSessions: totalSessions,
        expiresAt: getExpiresAt(),
      });

      // Add to existing so subsequent sessions see it
      existingAppointments.push(doc);

      logger.info('appointment.series.create: sessão criada', {
        doctor_id, appointment_id: appointmentId, seriesId, date: sessionDate, time: sessionTime,
      });
    }

    return { seriesId, sessions };
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
}

module.exports = CreateAppointmentSeriesOperation;
