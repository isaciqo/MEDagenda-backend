const { v4: uuidv4 } = require('uuid');

class CreateAppointmentOperation {
  constructor({ appointmentRepository, patientRepository }) {
    this.appointmentRepository = appointmentRepository;
    this.patientRepository = patientRepository;
  }

  async execute({ doctor_id, patientId, patientName, patientPhone, type, date, time, estimatedValue, notes, returnDate, returnTime, returnEstimatedValue }) {
    const patient = await this._resolvePatient({ doctor_id, patientId, patientName, patientPhone });

    const appointmentId = uuidv4();
    const appointment = await this.appointmentRepository.create({
      appointment_id: appointmentId,
      doctor_id,
      patient: {
        id: patient.patient_id,
        name: patient.displayName,
        phone: patient.phone,
      },
      type,
      date,
      time,
      estimatedValue,
      notes: notes || '',
      status: 'agendado',
    });

    if (returnDate) {
      await this.appointmentRepository.create({
        appointment_id: uuidv4(),
        doctor_id,
        patient: {
          id: patient.patient_id,
          name: patient.displayName,
          phone: patient.phone,
        },
        type,
        date: returnDate,
        time: returnTime || time,
        estimatedValue: returnEstimatedValue ?? estimatedValue,
        notes: '',
        status: 'agendado',
        isReturn: true,
        returnOf: appointmentId,
      });
    }

    return this._format(appointment);
  }

  async _resolvePatient({ doctor_id, patientId, patientName, patientPhone }) {
    // 1. Se veio patientId (autocomplete selecionado), busca direto
    if (patientId) {
      const found = await this.patientRepository.findById(patientId);
      if (found) return found;
    }

    // 2. Tenta encontrar pelo telefone
    if (patientPhone) {
      const byPhone = await this.patientRepository.findByPhone(doctor_id, patientPhone);
      if (byPhone) return byPhone;
    }

    // 3. Cria novo paciente automaticamente
    const sameNameCount = await this.patientRepository.countByName(doctor_id, patientName);
    const displayName = sameNameCount === 0 ? patientName : `${patientName} (paciente ${sameNameCount + 1})`;

    return await this.patientRepository.create({
      patient_id: uuidv4(),
      doctor_id,
      name: patientName,
      phone: patientPhone || '',
      displayName,
    });
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
      isReturn: a.isReturn ?? false,
      returnOf: a.returnOf ?? null,
    };
  }
}

module.exports = CreateAppointmentOperation;
