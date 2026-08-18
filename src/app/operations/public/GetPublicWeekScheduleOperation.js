class GetPublicWeekScheduleOperation {
  constructor({ appointmentRepository, userRepository, scheduleService }) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.scheduleService = scheduleService;
  }

  // Retorna a agenda do médico dia a dia (próximos 30 dias): o expediente do dia
  // (start/end) e os intervalos ocupados — sem grade de horários fixos nem nome de
  // paciente. A pessoa escolhe livremente a data e a hora; a validação de conflito
  // real (considerando duração) acontece no momento da solicitação.
  async execute(token) {
    const appointment = await this.appointmentRepository.findByConfirmToken(token);
    if (!appointment) {
      const error = new Error('Link de confirmação inválido ou expirado');
      error.statusCode = 400;
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

    if (doctor.allowPatientReschedule === false) {
      const error = new Error('Remarcação pelo paciente não está disponível para este consultório');
      error.statusCode = 403;
      throw error;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const fromStr = startDate.toISOString().split('T')[0];
    const toStr = endDate.toISOString().split('T')[0];

    const booked = await this.appointmentRepository.findByDoctorAndDateRange(appointment.doctor_id, fromStr, toStr);
    const bookedByDate = booked
      .filter(a => a.appointment_id !== appointment.appointment_id && a.status !== 'cancelado')
      .reduce((acc, a) => {
        (acc[a.date] ??= []).push(a);
        return acc;
      }, {});

    const schedule = doctor.schedule;
    const duration = doctor.defaultDuration || 30;
    const days = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const daySchedule = this.scheduleService.getDaySchedule(schedule, dateStr);

      if (daySchedule?.enabled) {
        const busy = (bookedByDate[dateStr] || []).map(a => ({
          start: a.time,
          end: this.scheduleService.addMinutes(a.time, duration),
        }));
        days.push({ date: dateStr, start: daySchedule.start, end: daySchedule.end, busy });
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      appointment: {
        patientName: appointment.patient.name,
        currentDate: appointment.date,
        currentTime: appointment.time,
      },
      doctorName: doctor.name,
      days,
    };
  }
}

module.exports = GetPublicWeekScheduleOperation;
