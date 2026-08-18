class RequestRescheduleByTokenOperation {
  constructor({ appointmentRepository, userRepository, scheduleService }) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.scheduleService = scheduleService;
  }

  async execute(token, { date, time }) {
    const appointment = await this.appointmentRepository.findByConfirmToken(token);
    if (!appointment) {
      const error = new Error('Link de confirmação inválido ou expirado');
      error.statusCode = 400;
      throw error;
    }

    if (appointment.status === 'cancelado' || appointment.status === 'realizado') {
      const error = new Error('Não é possível solicitar remarcação para esta consulta');
      error.statusCode = 400;
      throw error;
    }

    if (appointment.rescheduleRequest?.pending) {
      const error = new Error('Já existe uma solicitação de remarcação pendente para esta consulta');
      error.statusCode = 409;
      throw error;
    }

    const doctor = await this.userRepository.findById(appointment.doctor_id);
    if (doctor?.allowPatientReschedule === false) {
      const error = new Error('Remarcação pelo paciente não está disponível para este consultório');
      error.statusCode = 403;
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      const error = new Error('A data solicitada deve ser futura');
      error.statusCode = 400;
      throw error;
    }

    // Não deixa solicitar fora do expediente configurado (dia desabilitado ou
    // horário fora do start/end) — sem isso, o paciente podia enviar qualquer
    // date/time direto pra API, ignorando os horários mostrados na tela.
    if (!this.scheduleService.isSlotOpen(doctor?.schedule, date, time)) {
      const error = new Error('Esse horário está fora do expediente. Escolha outro.');
      error.statusCode = 400;
      throw error;
    }

    // Conflito por sobreposição de intervalo, não só horário exato — uma consulta
    // com horário "torto" (ex: 11:33) também ocupa os slots vizinhos da grade.
    const dayAppointments = await this.appointmentRepository.findByDoctorAndDateRange(appointment.doctor_id, date, date);
    const others = dayAppointments.filter(a => a.appointment_id !== appointment.appointment_id);
    const duration = doctor?.defaultDuration || 30;
    if (this.scheduleService.hasOverlap(others, date, time, duration)) {
      const error = new Error('Esse horário já está ocupado. Escolha outro.');
      error.statusCode = 409;
      throw error;
    }

    await this.appointmentRepository.update(appointment.appointment_id, {
      rescheduleRequest: {
        pending: true,
        requestedDate: date,
        requestedTime: time,
        requestedAt: new Date(),
      },
    });

    return {
      patientName: appointment.patient.name,
      requestedDate: date,
      requestedTime: time,
    };
  }
}

module.exports = RequestRescheduleByTokenOperation;
