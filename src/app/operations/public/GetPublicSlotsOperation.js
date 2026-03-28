const { v4: uuidv4 } = require('uuid');

class GetPublicSlotsOperation {
  constructor({ appointmentRepository, userRepository, tokenService }) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  async execute(token) {
    let payload;
    try {
      payload = this.tokenService.verify(token);
    } catch {
      const error = new Error('Link inválido ou expirado');
      error.statusCode = 400;
      throw error;
    }

    if (payload.action !== 'reschedule') {
      const error = new Error('Link inválido');
      error.statusCode = 400;
      throw error;
    }

    const appointment = await this.appointmentRepository.findById(payload.appointment_id);
    if (!appointment) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (appointment.status === 'cancelado') {
      const error = new Error('Esta consulta foi cancelada');
      error.statusCode = 400;
      throw error;
    }

    const doctor = await this.userRepository.findById(appointment.doctor_id);
    if (!doctor) {
      const error = new Error('Médico não encontrado');
      error.statusCode = 404;
      throw error;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const fromStr = startDate.toISOString().split('T')[0];
    const toStr = endDate.toISOString().split('T')[0];

    const booked = await this.appointmentRepository.findByDoctorAndDateRange(appointment.doctor_id, fromStr, toStr);
    const bookedSet = new Set(
      booked
        .filter(a => a.appointment_id !== payload.appointment_id && a.status !== 'cancelado')
        .map(a => `${a.date}-${a.time}`)
    );

    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const schedule = doctor.schedule;
    const duration = doctor.defaultDuration || 30;
    const slots = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const dayName = dayNames[current.getDay()];
      const daySchedule = schedule instanceof Map ? schedule.get(dayName) : schedule[dayName];

      if (daySchedule && daySchedule.enabled) {
        const dateStr = current.toISOString().split('T')[0];
        const times = this._generateSlots(daySchedule.start, daySchedule.end, duration);

        times.forEach(time => {
          if (!bookedSet.has(`${dateStr}-${time}`)) {
            slots.push({
              id: uuidv4(),
              date: dateStr,
              startTime: time,
              endTime: this._addMinutes(time, duration),
            });
          }
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      appointment: {
        id: appointment.appointment_id,
        patientName: appointment.patient.name,
        currentDate: appointment.date,
        currentTime: appointment.time,
      },
      doctorName: doctor.name,
      slots,
    };
  }

  _generateSlots(start, end, duration) {
    const slots = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const endTotal = endH * 60 + endM;

    while (h * 60 + m < endTotal) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      m += duration;
      h += Math.floor(m / 60);
      m = m % 60;
    }
    return slots;
  }

  _addMinutes(time, minutes) {
    let [h, m] = time.split(':').map(Number);
    m += minutes;
    h += Math.floor(m / 60);
    m = m % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}

module.exports = GetPublicSlotsOperation;
