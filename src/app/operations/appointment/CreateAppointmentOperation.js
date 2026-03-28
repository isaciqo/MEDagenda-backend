const { v4: uuidv4 } = require('uuid');

class CreateAppointmentOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ doctor_id, patientName, patientPhone, type, date, time, estimatedValue, notes }) {
    const appointment = await this.appointmentRepository.create({
      appointment_id: uuidv4(),
      doctor_id,
      patient: {
        id: uuidv4(),
        name: patientName,
        phone: patientPhone,
      },
      type,
      date,
      time,
      estimatedValue,
      notes: notes || '',
      status: 'agendado',
    });

    return this._format(appointment);
  }

  _format(a) {
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

module.exports = CreateAppointmentOperation;
