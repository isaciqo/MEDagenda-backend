const { v4: uuidv4 } = require('uuid');

class GetPublicSlotsOperation {
  constructor({ appointmentRepository, userRepository, tokenService, scheduleService }) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.scheduleService = scheduleService;
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

    const schedule = doctor.schedule;
    const duration = doctor.defaultDuration || 30;
    const slots = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const daySchedule = this.scheduleService.getDaySchedule(schedule, dateStr);

      if (daySchedule?.enabled) {
        const times = this.scheduleService.generateDaySlots(daySchedule, duration);

        times.forEach(time => {
          if (!bookedSet.has(`${dateStr}-${time}`)) {
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
}

module.exports = GetPublicSlotsOperation;
