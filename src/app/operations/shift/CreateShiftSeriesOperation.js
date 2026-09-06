const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');
const { generateShiftSeriesDates } = require('../../../lib/shiftRecurrence');
const { daysBetween, addDays, toAbsoluteMinutes, intervalsOverlap } = require('../../../lib/dateTimeRange');

const EXPIRY_YEARS = parseInt(process.env.APPOINTMENT_EXPIRY_YEARS) || 2;

function getExpiresAt() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + EXPIRY_YEARS);
  return d;
}

class CreateShiftSeriesOperation {
  constructor({ shiftRepository, locationRepository, appointmentRepository, userRepository }) {
    this.shiftRepository = shiftRepository;
    this.locationRepository = locationRepository;
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
  }

  async execute({ doctor_id, locationId, date, time, endDate, endTime, estimatedValue, notes, recurrence }) {
    const location = await this.locationRepository.findById(locationId);
    if (!location || location.doctor_id !== doctor_id) {
      const error = new Error('Local não encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Todas as ocorrências herdam a mesma "forma" (quantos dias o plantão dura)
    // do exemplo que o médico preencheu — se ele fez 22h→10h do dia seguinte
    // (dayOffset=1), toda ocorrência gerada também dura 1 dia a mais.
    const dayOffset = daysBetween(date, endDate);
    const occurrenceDates = generateShiftSeriesDates({ startDate: date, recurrence });
    if (occurrenceDates.length === 0) {
      const error = new Error('Nenhuma data gerada pra essa recorrência.');
      error.statusCode = 400;
      throw error;
    }
    const occurrences = occurrenceDates.map(d => ({ date: d, endDate: addDays(d, dayOffset) }));
    const lastEndDate = occurrences[occurrences.length - 1].endDate;

    // Appointment não guarda duração própria — mesma convenção já usada em
    // AcceptRescheduleRequestOperation pra estimar o fim de uma consulta.
    const doctor = await this.userRepository.findById(doctor_id);
    const defaultDuration = doctor?.defaultDuration || 30;

    const existingShifts = await this.shiftRepository.findByDoctorAndDateRange(doctor_id, date, lastEndDate);
    const existingAppointments = await this.appointmentRepository.findByDoctorAndDateRange(doctor_id, date, lastEndDate);

    // Intervalos já ocupados: plantões e consultas existentes, mais os que a
    // própria série vai criando (protege contra a série sobrepor a si mesma —
    // ex: duração de cada plantão maior que o passo entre ocorrências).
    const busyIntervals = [
      ...existingShifts.map(s => ({ start: toAbsoluteMinutes(s.date, s.time), end: toAbsoluteMinutes(s.endDate, s.endTime) })),
      ...existingAppointments
        .filter(a => a.status !== 'cancelado')
        .map(a => {
          const start = toAbsoluteMinutes(a.date, a.time);
          return { start, end: start + defaultDuration };
        }),
    ];

    const seriesId = uuidv4();
    const sessions = [];
    const totalSessions = occurrences.length;

    // Não bloqueia por conflito — mesmo comportamento de CreateAppointmentOperation/
    // CreateAppointmentSeriesOperation hoje (dois compromissos no mesmo horário já
    // são permitidos por design). Só sinaliza o status pra UI avisar o médico.
    for (let i = 0; i < occurrences.length; i++) {
      const { date: occDate, endDate: occEndDate } = occurrences[i];
      const start = toAbsoluteMinutes(occDate, time);
      const end = toAbsoluteMinutes(occEndDate, endTime);
      const conflict = busyIntervals.some(b => intervalsOverlap(start, end, b.start, b.end));

      const shift = await this.shiftRepository.create({
        shift_id: uuidv4(),
        doctor_id,
        locationId: location.location_id,
        locationName: location.name,
        locationColor: location.color,
        date: occDate,
        time,
        endDate: occEndDate,
        endTime,
        estimatedValue,
        notes: notes || '',
        status: 'agendado',
        seriesId,
        seriesIndex: i,
        seriesTotalSessions: totalSessions,
        expiresAt: getExpiresAt(),
      });

      busyIntervals.push({ start, end });
      sessions.push({
        shiftId: shift.shift_id,
        date: occDate,
        time,
        endDate: occEndDate,
        endTime,
        status: conflict ? 'conflict' : 'ok',
      });
    }

    // Mesma ideia do CreateShiftOperation: a "forma" que o médico preencheu no
    // exemplo da série vira a duração padrão do local, pra pré-preencher o fim
    // na próxima. Melhor esforço, não derruba a série se falhar.
    const durationMinutes = toAbsoluteMinutes(endDate, endTime) - toAbsoluteMinutes(date, time);
    if (durationMinutes > 0 && durationMinutes !== location.defaultShiftDurationMinutes) {
      try {
        await this.locationRepository.update(location.location_id, { defaultShiftDurationMinutes: durationMinutes });
      } catch (err) {
        logger.warn('shift.series.create: falha ao salvar duração padrão do local', { doctor_id, locationId, error: err.message });
      }
    }

    logger.info('shift.series.create: série criada', {
      doctor_id, seriesId, total: totalSessions, conflicts: sessions.filter(s => s.status === 'conflict').length,
    });

    return { seriesId, sessions };
  }
}

module.exports = CreateShiftSeriesOperation;
