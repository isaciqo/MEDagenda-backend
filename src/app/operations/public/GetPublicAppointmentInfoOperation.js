class GetPublicAppointmentInfoOperation {
  constructor({ appointmentRepository, userRepository }) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
  }

  async execute(token) {
    const appointment = await this.appointmentRepository.findByConfirmToken(token);
    if (!appointment) {
      const error = new Error('Link de confirmação inválido ou expirado');
      error.statusCode = 400;
      throw error;
    }

    const doctor = await this.userRepository.findById(appointment.doctor_id);

    return {
      patientName: appointment.patient.name,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      doctorName: doctor?.name ?? '',
      allowReschedule: doctor?.allowPatientReschedule ?? true,
      hasPendingReschedule: !!appointment.rescheduleRequest?.pending,
    };
  }
}

module.exports = GetPublicAppointmentInfoOperation;
