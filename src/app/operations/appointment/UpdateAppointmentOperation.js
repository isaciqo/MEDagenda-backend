class UpdateAppointmentOperation {
  constructor({ appointmentRepository, userRepository, planService }) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.planService = planService;
  }

  async execute(appointment_id, doctor_id, { type, date, time, estimatedValue, notes }) {
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

    // RN-04: evita bypass do limite mensal movendo consulta para mês já lotado
    if (date !== undefined) {
      const existingYM = existing.date.slice(0, 7);
      const newYM = date.slice(0, 7);
      if (newYM !== existingYM) {
        const user = await this.userRepository.findById(doctor_id);
        const [newYear, newMonth] = newYM.split('-').map(Number);
        const targetCount = await this.appointmentRepository.countByDoctorAndMonth(doctor_id, newYear, newMonth);
        this.planService.canCreateAppointment(user, targetCount, 1);
      }
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await this.appointmentRepository.update(appointment_id, updateData);

    return {
      id: updated.appointment_id,
      patient: updated.patient,
      type: updated.type,
      date: updated.date,
      time: updated.time,
      estimatedValue: updated.estimatedValue,
      paidValue: updated.paidValue,
      paymentMethod: updated.paymentMethod,
      paymentDate: updated.paymentDate,
      status: updated.status,
      notes: updated.notes,
      isReturn: updated.isReturn ?? false,
      returnOf: updated.returnOf ?? null,
    };
  }
}

module.exports = UpdateAppointmentOperation;
