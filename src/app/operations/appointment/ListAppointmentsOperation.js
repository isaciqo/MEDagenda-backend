class ListAppointmentsOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ doctor_id, date, status, from, to }) {
    const appointments = await this.appointmentRepository.findAll({ doctor_id, date, status, from, to });
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
      location: a.location || '',
      meetingLink: a.meetingLink ?? null,
      rescheduleRequest: {
        pending: !!a.rescheduleRequest?.pending,
        requestedDate: a.rescheduleRequest?.requestedDate ?? null,
        requestedTime: a.rescheduleRequest?.requestedTime ?? null,
      },
      isReturn: a.isReturn ?? false,
      returnOf: a.returnOf ?? null,
      seriesId: a.seriesId ?? null,
      seriesIndex: a.seriesIndex ?? null,
      seriesTotalSessions: a.seriesTotalSessions ?? null,
    }));
  }
}

module.exports = ListAppointmentsOperation;
