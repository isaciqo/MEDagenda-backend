const { v4: uuidv4 } = require('uuid');

class GetAvailabilitySlotsOperation {
  constructor({ userRepository, appointmentRepository, scheduleService }) {
    this.userRepository = userRepository;
    this.appointmentRepository = appointmentRepository;
    this.scheduleService = scheduleService;
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

    const schedule = doctor.schedule;
    const defaultDuration = doctor.defaultDuration || 30;
    const slots = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const daySchedule = this.scheduleService.getDaySchedule(schedule, dateStr);

      if (daySchedule?.enabled) {
        const slotTimes = this.scheduleService.generateDaySlots(daySchedule, defaultDuration);

        slotTimes.forEach(time => {
          slots.push({
            id: uuidv4(),
            date: dateStr,
            startTime: time,
            endTime: this.scheduleService.addMinutes(time, defaultDuration),
            isBooked: bookedSlots.has(`${dateStr}-${time}`),
          });
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }
}

module.exports = GetAvailabilitySlotsOperation;
