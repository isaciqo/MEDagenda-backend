class UpdateAppointmentOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointment_id, { patientName, type, date, time, estimatedValue, notes }) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue;
    if (notes !== undefined) updateData.notes = notes;
    if (patientName !== undefined) updateData['patient.name'] = patientName;

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
