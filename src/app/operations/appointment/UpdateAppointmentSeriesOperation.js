const ALLOWED_FIELDS = ['time', 'estimatedValue', 'notes', 'location'];

class UpdateAppointmentSeriesOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ doctor_id, seriesId, fromDate, data }) {
    const appointments = await this.appointmentRepository.findBySeriesId(seriesId);
    const toUpdate = appointments.filter(
      a => a.doctor_id === doctor_id && a.date >= fromDate && a.status !== 'realizado'
    );

    const updateData = {};
    for (const key of ALLOWED_FIELDS) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }

    for (const appt of toUpdate) {
      await this.appointmentRepository.update(appt.appointment_id, updateData);
    }
    return { updated: toUpdate.length };
  }
}

module.exports = UpdateAppointmentSeriesOperation;
