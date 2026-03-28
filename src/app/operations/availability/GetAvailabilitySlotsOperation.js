const { v4: uuidv4 } = require('uuid');

class GetAvailabilitySlotsOperation {
  constructor({ userRepository, appointmentRepository }) {
    this.userRepository = userRepository;
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ doctor_id, from, to }) {
    const doctor = await this.userRepository.findById(doctor_id);
    if (!doctor) {
      const error = new Error('Doctor not found');
      error.statusCode = 404;
      throw error;
    }

    const startDate = from ? new Date(from) : new Date();
    const endDate = to ? new Date(to) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const bookedAppointments = await this.appointmentRepository.findByDoctorAndDateRange(
      doctor_id,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    const bookedSlots = new Set(bookedAppointments.map(a => `${a.date}-${a.time}`));

    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const schedule = doctor.schedule;
    const defaultDuration = doctor.defaultDuration || 30;
    const slots = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const dayName = dayNames[current.getDay()];
      const daySchedule = schedule instanceof Map ? schedule.get(dayName) : schedule[dayName];

      if (daySchedule && daySchedule.enabled) {
        const dateStr = current.toISOString().split('T')[0];
        const slotTimes = this._generateSlots(daySchedule.start, daySchedule.end, defaultDuration);

        slotTimes.forEach(time => {
          slots.push({
            id: uuidv4(),
            date: dateStr,
            startTime: time,
            endTime: this._addMinutes(time, defaultDuration),
            isBooked: bookedSlots.has(`${dateStr}-${time}`),
          });
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  _generateSlots(start, end, durationMinutes) {
    const slots = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const endTotal = endH * 60 + endM;

    while (h * 60 + m < endTotal) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      m += durationMinutes;
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

module.exports = GetAvailabilitySlotsOperation;
