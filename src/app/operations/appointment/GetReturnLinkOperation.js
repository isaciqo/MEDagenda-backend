class GetReturnLinkOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointment_id, { daysAhead }) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + (daysAhead || 15));
    const dateStr = returnDate.toISOString().split('T')[0];

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const link = `${appUrl}/agendar?patient=${encodeURIComponent(existing.patient.name)}&phone=${encodeURIComponent(existing.patient.phone)}&date=${dateStr}`;

    return { link };
  }
}

module.exports = GetReturnLinkOperation;
