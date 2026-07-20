class ExportPatientDataOperation {
  constructor({ patientRepository, appointmentRepository, reviewRepository }) {
    this.patientRepository = patientRepository;
    this.appointmentRepository = appointmentRepository;
    this.reviewRepository = reviewRepository;
  }

  async execute(patient_id, doctor_id) {
    const patient = await this.patientRepository.findById(patient_id);
    if (!patient) {
      const error = new Error('Cliente não encontrado');
      error.statusCode = 404;
      throw error;
    }

    // C01: verificação de dono (IDOR fix)
    if (patient.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    const appointments = await this.appointmentRepository.findByPatientId(patient_id);
    const appointmentIds = appointments.map(a => a.appointment_id);
    const reviews = await this.reviewRepository.findByAppointmentIds(appointmentIds);

    return {
      exportedAt: new Date().toISOString(),
      patient: {
        id: patient.patient_id,
        name: patient.name,
        phone: patient.phone,
        createdAt: patient.createdAt,
      },
      appointments: appointments.map(a => ({
        id: a.appointment_id,
        date: a.date,
        time: a.time,
        type: a.type,
        status: a.status,
        estimatedValue: a.estimatedValue,
        paidValue: a.paidValue,
        paymentMethod: a.paymentMethod,
        paymentDate: a.paymentDate,
        notes: a.notes,
        location: a.location,
        createdAt: a.createdAt,
      })),
      reviews: reviews.map(r => ({
        id: r.review_id,
        rating: r.rating,
        comment: r.comment,
        date: r.date,
      })),
    };
  }
}

module.exports = ExportPatientDataOperation;
