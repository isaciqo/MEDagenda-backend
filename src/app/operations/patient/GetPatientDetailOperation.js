// Visão 360º do cliente: resumo + histórico de consultas + avaliações + total
// financeiro. Reaproveita as mesmas 3 consultas que o ExportPatientDataOperation
// já fazia (Patient -> Appointments por patient.id -> Reviews por appointment_id
// IN [...]) — nenhuma coleção nova, nenhuma agregação pesada no Mongo. Os totais
// são somados em memória porque o volume por paciente é sempre pequeno (dezenas
// de consultas, não milhares).
class GetPatientDetailOperation {
  constructor({ patientRepository, appointmentRepository, reviewRepository, userRepository, planService }) {
    this.patientRepository = patientRepository;
    this.appointmentRepository = appointmentRepository;
    this.reviewRepository = reviewRepository;
    this.userRepository = userRepository;
    this.planService = planService;
  }

  async execute(patient_id, doctor_id) {
    const patient = await this.patientRepository.findById(patient_id);
    if (!patient) {
      const error = new Error('Cliente não encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Mesma checagem de dono (IDOR fix) que o export já usa.
    if (patient.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    const user = await this.userRepository.findById(doctor_id);
    const hasReviews = user ? this.planService.hasFeature(user, 'avaliacoes') : false;
    const hasFinancial = user ? this.planService.hasFeature(user, 'financeiro_completo') : false;

    const appointments = await this.appointmentRepository.findByPatientId(patient_id);
    const sortedAppointments = [...appointments].sort((a, b) =>
      `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
    );
    const lastAppointment = sortedAppointments[0] || null;

    const totalReceived = appointments
      .filter(a => a.status === 'realizado')
      .reduce((sum, a) => sum + (a.paidValue || 0), 0);

    let reviews = null;
    let averageRating = null;
    if (hasReviews) {
      const appointmentIds = appointments.map(a => a.appointment_id);
      const foundReviews = await this.reviewRepository.findByAppointmentIds(appointmentIds);
      reviews = foundReviews
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .map(r => ({ id: r.review_id, rating: r.rating, comment: r.comment, date: r.date }));
      averageRating = foundReviews.length > 0
        ? Math.round((foundReviews.reduce((s, r) => s + r.rating, 0) / foundReviews.length) * 10) / 10
        : null;
    }

    return {
      patient: {
        id: patient.patient_id,
        name: patient.name,
        displayName: patient.displayName,
        phone: patient.phone,
        createdAt: patient.createdAt,
      },
      summary: {
        appointmentCount: appointments.length,
        lastAppointmentDate: lastAppointment ? lastAppointment.date : null,
        averageRating,
      },
      appointments: sortedAppointments.map(a => ({
        id: a.appointment_id,
        date: a.date,
        time: a.time,
        type: a.type,
        status: a.status,
        paidValue: a.paidValue,
        notes: a.notes || null,
      })),
      reviews,
      financialSummary: hasFinancial ? { totalReceived } : null,
    };
  }
}

module.exports = GetPatientDetailOperation;
