class RealizeAppointmentOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointment_id, { paidValue, paymentMethod, paymentDate }) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    const a = await this.appointmentRepository.update(appointment_id, {
      status: 'realizado',
      paidValue,
      paymentMethod,
      paymentDate,
    });

    return {
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
    };
  }
}

module.exports = RealizeAppointmentOperation;
