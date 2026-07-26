class DeleteAppointmentSeriesOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ doctor_id, seriesId, fromDate }) {
    const appointments = await this.appointmentRepository.findBySeriesId(seriesId);
    const toDelete = appointments.filter(
      a => a.doctor_id === doctor_id && a.date >= fromDate && a.status !== 'realizado'
    );
    for (const appt of toDelete) {
      await this.appointmentRepository.delete(appt.appointment_id);
    }
    return { deleted: toDelete.length };
  }
}

module.exports = DeleteAppointmentSeriesOperation;
