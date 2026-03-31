class ListAppointmentsOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ doctor_id, date, status }) {
    const appointments = await this.appointmentRepository.findAll({ doctor_id, date, status });
    return appointments.map(a => ({
      id: a.appointment_id,
      patient: a.patient,
      type: a.type,
      date: a.date,
      time: a.time,
      estimatedValue: a.estimatedValue,
      paidValue: a.paidValue,
      paymentMethod: a.paymentMethod,
      paymentDate: a.paymentDate,
      status: a.status,
      notes: a.notes,
      isReturn: a.isReturn ?? false,
      returnOf: a.returnOf ?? null,
    }));
  }
}

module.exports = ListAppointmentsOperation;
