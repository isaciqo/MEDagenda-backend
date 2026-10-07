const { v4: uuidv4 } = require('uuid');

class GetPublicBookingSlotsOperation {
  constructor({ userRepository, appointmentRepository, blockedPeriodRepository, scheduleService }) {
    this.userRepository = userRepository;
    this.appointmentRepository = appointmentRepository;
    this.blockedPeriodRepository = blockedPeriodRepository;
    this.scheduleService = scheduleService;
  }

  async execute(code) {
    const doctor = await this.userRepository.findByPublicBookingCode(code);
    if (!doctor || !doctor.publicBookingEnabled) {
      const error = new Error('Link inválido ou agendamento público desativado');
      error.statusCode = 400;
      throw error;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const fromStr = startDate.toISOString().split('T')[0];
    const toStr = endDate.toISOString().split('T')[0];

    const [booked, blockedPeriods] = await Promise.all([
      this.appointmentRepository.findByDoctorAndDateRange(doctor.user_id, fromStr, toStr),
      this.blockedPeriodRepository.findByDoctorAndDateRange(doctor.user_id, fromStr, toStr),
    ]);
    const bookedSet = new Set(
      booked.filter(a => a.status !== 'cancelado').map(a => `${a.date}-${a.time}`)
    );

    const schedule = doctor.schedule;
    const duration = doctor.publicBookingDuration || doctor.defaultDuration || 30;
    const slots = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const daySchedule = this.scheduleService.getDaySchedule(schedule, dateStr);

      if (daySchedule?.enabled) {
        const times = this.scheduleService.generateDaySlots(daySchedule, duration);

        times.forEach(time => {
          if (
            !bookedSet.has(`${dateStr}-${time}`) &&
            !this.scheduleService.isBlocked(blockedPeriods, dateStr, time, duration)
          ) {
            slots.push({
              id: uuidv4(),
              date: dateStr,
              startTime: time,
              endTime: this.scheduleService.addMinutes(time, duration),
            });
          }
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      doctorName: doctor.displayName || doctor.name,
      slots,
    };
  }
}

module.exports = GetPublicBookingSlotsOperation;
