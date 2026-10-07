// Aceite de um pedido feito pela página pública de agendamento (status
// 'aguardando_confirmacao', sem publicBookingAutoAccept) — diferente de
// AcceptRescheduleRequestOperation, que troca date/time de uma consulta já
// confirmada. Aqui a consulta já existe com a data certa, só falta confirmar.
class AcceptBookingRequestOperation {
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

    if (existing.status !== 'aguardando_confirmacao') {
      const error = new Error('Esta consulta não está aguardando confirmação');
      error.statusCode = 400;
      throw error;
    }

    // Revalida o expediente e sobreposição — o médico pode ter mudado o
    // horário de atendimento ou criado outra consulta entre o pedido e o aceite.
    const doctor = await this.userRepository.findById(doctor_id);
    if (!this.scheduleService.isSlotOpen(doctor?.schedule, existing.date, existing.time)) {
      const error = new Error('Esse horário está fora do expediente configurado. Ajuste antes de aceitar.');
      error.statusCode = 400;
      throw error;
    }

    const dayAppointments = await this.appointmentRepository.findByDoctorAndDateRange(doctor_id, existing.date, existing.date);
    const others = dayAppointments.filter(a => a.appointment_id !== appointment_id);
    const duration = doctor?.defaultDuration || 30;
    if (this.scheduleService.hasOverlap(others, existing.date, existing.time, duration)) {
      const error = new Error('Já existe uma consulta agendada para esse horário');
      error.statusCode = 409;
      throw error;
    }

    const updated = await this.appointmentRepository.update(appointment_id, { status: 'agendado' });

    return {
      id: updated.appointment_id,
      date: updated.date,
      time: updated.time,
      patientName: updated.patient.name,
      patientPhone: updated.patient.phone,
    };
  }
}

module.exports = AcceptBookingRequestOperation;
