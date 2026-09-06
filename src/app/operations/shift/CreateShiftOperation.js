const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');
const { toAbsoluteMinutes } = require('../../../lib/dateTimeRange');

const EXPIRY_YEARS = parseInt(process.env.APPOINTMENT_EXPIRY_YEARS) || 2;

function getExpiresAt() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + EXPIRY_YEARS);
  return d;
}

class CreateShiftOperation {
  constructor({ shiftRepository, locationRepository }) {
    this.shiftRepository = shiftRepository;
    this.locationRepository = locationRepository;
  }

  async execute({ doctor_id, locationId, date, time, endDate, endTime, estimatedValue, notes }) {
    const location = await this._resolveLocation(doctor_id, locationId);

    const shift = await this.shiftRepository.create({
      shift_id: uuidv4(),
      doctor_id,
      locationId: location.location_id,
      locationName: location.name,
      locationColor: location.color,
      date,
      time,
      endDate,
      endTime,
      estimatedValue,
      notes: notes || '',
      status: 'agendado',
      expiresAt: getExpiresAt(),
    });

    // Guarda a duração desse plantão como padrão do local, pra pré-preencher o
    // horário de fim na próxima vez que o médico escolher esse mesmo local.
    // Último plantão criado sempre vence. Melhor esforço: se falhar, o plantão
    // já foi criado, não é motivo pra derrubar a request.
    const durationMinutes = toAbsoluteMinutes(endDate, endTime) - toAbsoluteMinutes(date, time);
    if (durationMinutes > 0 && durationMinutes !== location.defaultShiftDurationMinutes) {
      try {
        await this.locationRepository.update(location.location_id, { defaultShiftDurationMinutes: durationMinutes });
      } catch (err) {
        logger.warn('shift.create: falha ao salvar duração padrão do local', { doctor_id, locationId, error: err.message });
      }
    }

    logger.info('shift.create: plantão agendado', { doctor_id, shift_id: shift.shift_id, date, locationId });
    return this._format(shift);
  }

  async _resolveLocation(doctor_id, locationId) {
    const location = await this.locationRepository.findById(locationId);
    if (!location || location.doctor_id !== doctor_id) {
      const error = new Error('Local não encontrado');
      error.statusCode = 404;
      throw error;
    }
    return location;
  }

  _format(s) {
    return {
      id: s.shift_id,
      locationId: s.locationId,
      locationName: s.locationName,
      locationColor: s.locationColor,
      date: s.date,
      time: s.time,
      endDate: s.endDate,
      endTime: s.endTime,
      estimatedValue: s.estimatedValue,
      paidValue: s.paidValue,
      netValue: s.netValue,
      paymentMethod: s.paymentMethod,
      paymentDate: s.paymentDate,
      status: s.status,
      notes: s.notes,
      seriesId: s.seriesId ?? null,
      seriesIndex: s.seriesIndex ?? null,
      seriesTotalSessions: s.seriesTotalSessions ?? null,
    };
  }
}

module.exports = CreateShiftOperation;
