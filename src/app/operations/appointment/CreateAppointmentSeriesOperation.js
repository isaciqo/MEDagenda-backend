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

function parseTime(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

const DAY_KEYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

class CreateAppointmentSeriesOperation {
  constructor({ appointmentRepository, patientRepository, userRepository, planService }) {
    this.appointmentRepository = appointmentRepository;
    this.patientRepository = patientRepository;
    this.userRepository = userRepository;
    this.planService = planService;
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

    const existingAppointments = await this.appointmentRepository.findAll({
      doctor_id,
      from: date,
      to: dates[dates.length - 1],
    });

    const seriesId = uuidv4();
    const sessions = [];

    for (let i = 0; i < dates.length; i++) {
      const sessionDate = dates[i];
      let sessionTime = time;
      let sessionStatus = 'ok';

      const conflict = existingAppointments.find(
        a => a.date === sessionDate && a.time === sessionTime && a.status !== 'cancelado'
      );

      if (conflict) {
        const adjusted = this._findNextFreeSlot(existingAppointments, sessionDate, sessionTime, defaultDuration, schedule);
        if (adjusted !== sessionTime) {
          const originalTime = sessionTime;
          sessionTime = adjusted;
          sessionStatus = 'adjusted';
          sessions.push({ appointmentId: null, date: sessionDate, time: sessionTime, status: sessionStatus, originalTime });
        } else {
          sessionStatus = 'conflict';
          sessions.push({ appointmentId: null, date: sessionDate, time: sessionTime, status: sessionStatus });
        }
      } else {
        sessions.push({ appointmentId: null, date: sessionDate, time: sessionTime, status: sessionStatus });
      }

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

  _findNextFreeSlot(existingAppointments, date, startTime, duration, schedule) {
    let timeMins = parseTime(startTime) + duration;

    const dayKey = DAY_KEYS[new Date(date + 'T00:00:00').getDay()];
    const endStr = schedule instanceof Map
      ? schedule.get(dayKey)?.end ?? '23:00'
      : (schedule?.[dayKey]?.end ?? '23:00');
    const endMins = parseTime(endStr);

    for (let i = 0; i < 20; i++) {
      if (timeMins >= endMins) break;
      const candidate = formatTime(timeMins);
      const conflict = existingAppointments.find(
        a => a.date === date && a.time === candidate && a.status !== 'cancelado'
      );
      if (!conflict) return candidate;
      timeMins += duration;
    }
    return startTime;
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
