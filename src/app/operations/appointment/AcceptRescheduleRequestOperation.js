class AcceptRescheduleRequestOperation {
  constructor({ appointmentRepository, userRepository, scheduleService }) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.scheduleService = scheduleService;
  }

  async execute(appointment_id, doctor_id) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (existing.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    if (!existing.rescheduleRequest?.pending) {
      const error = new Error('Não há solicitação de remarcação pendente para esta consulta');
      error.statusCode = 400;
      throw error;
    }

    const { requestedDate, requestedTime } = existing.rescheduleRequest;

    // Revalida o expediente no aceite também — a solicitação já foi checada na
    // hora de criar, mas o médico pode ter mudado o horário de atendimento
    // (ou desabilitado o dia) entre o pedido do paciente e este aceite.
    const doctor = await this.userRepository.findById(doctor_id);
    if (!this.scheduleService.isSlotOpen(doctor?.schedule, requestedDate, requestedTime)) {
      const error = new Error('Esse horário está fora do expediente configurado. Ajuste antes de aceitar.');
      error.statusCode = 400;
      throw error;
    }

    // Sobreposição de intervalo, não só horário exato — pode ter surgido outra
    // consulta "torta" entre o pedido do paciente e o aceite do médico.
    const dayAppointments = await this.appointmentRepository.findByDoctorAndDateRange(doctor_id, requestedDate, requestedDate);
    const others = dayAppointments.filter(a => a.appointment_id !== appointment_id);
    const duration = doctor?.defaultDuration || 30;
    if (this.scheduleService.hasOverlap(others, requestedDate, requestedTime, duration)) {
      const error = new Error('Já existe uma consulta agendada para esse horário');
      error.statusCode = 409;
      throw error;
    }

    const updated = await this.appointmentRepository.update(appointment_id, {
      date: requestedDate,
      time: requestedTime,
      rescheduleCount: (existing.rescheduleCount || 0) + 1,
      rescheduleRequest: { pending: false, requestedDate: null, requestedTime: null, requestedAt: null },
    });

    return {
      id: updated.appointment_id,
      date: updated.date,
      time: updated.time,
      patientName: updated.patient.name,
      patientPhone: updated.patient.phone,
    };
  }
}

module.exports = AcceptRescheduleRequestOperation;
