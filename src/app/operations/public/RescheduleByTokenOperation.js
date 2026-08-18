const { v4: uuidv4 } = require('uuid');

class RescheduleByTokenOperation {
  constructor({ appointmentRepository, tokenService, userRepository, scheduleService }) {
    this.appointmentRepository = appointmentRepository;
    this.tokenService = tokenService;
    this.userRepository = userRepository;
    this.scheduleService = scheduleService;
  }

  async execute(token, { date, time }) {
    let payload;
    try {
      payload = this.tokenService.verify(token);
    } catch {
      const error = new Error('Link inválido ou expirado');
      error.statusCode = 400;
      throw error;
    }

    if (payload.action !== 'reschedule') {
      const error = new Error('Link inválido');
      error.statusCode = 400;
      throw error;
    }

    const old = await this.appointmentRepository.findById(payload.appointment_id);
    if (!old) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (old.status === 'cancelado') {
      const error = new Error('Esta consulta foi cancelada');
      error.statusCode = 400;
      throw error;
    }

    // P01: não permite reagendar para data passada
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      const error = new Error('A data do reagendamento deve ser futura');
      error.statusCode = 400;
      throw error;
    }

    // Não deixa reagendar pra fora do expediente configurado (dia desabilitado
    // ou horário fora do start/end) — sem isso, o paciente podia enviar
    // qualquer date/time direto pra API, ignorando os slots oferecidos na tela.
    const doctor = await this.userRepository.findById(old.doctor_id);
    if (!this.scheduleService.isSlotOpen(doctor?.schedule, date, time)) {
      const error = new Error('Esse horário está fora do expediente. Escolha outro.');
      error.statusCode = 400;
      throw error;
    }

    // P02: verifica conflito de horário no novo slot
    const conflict = await this.appointmentRepository.findByDoctorDateTime(old.doctor_id, date, time);
    if (conflict) {
      const error = new Error('Já existe uma consulta agendada para esse horário');
      error.statusCode = 409;
      throw error;
    }

    // P03: cria nova consulta ANTES de cancelar a antiga — evita perda em caso de falha
    const newAppointment = await this.appointmentRepository.create({
      appointment_id: uuidv4(),
      doctor_id: old.doctor_id,
      patient: old.patient,
      type: old.type,
      date,
      time,
      estimatedValue: old.estimatedValue,
      notes: old.notes,
      status: 'agendado',
      rescheduleCount: (old.rescheduleCount || 0) + 1, // RN06: propaga contador ao novo
    });

    // Cancela antiga somente depois da nova criada com sucesso
    await this.appointmentRepository.update(payload.appointment_id, { status: 'cancelado' });

    return {
      id: newAppointment.appointment_id, // P04: retorna ID para médico gerar novos links
      patientName: newAppointment.patient.name,
      date: newAppointment.date,
      time: newAppointment.time,
    };
  }
}

module.exports = RescheduleByTokenOperation;
