const { v4: uuidv4 } = require('uuid');

class RescheduleByTokenOperation {
  constructor({ appointmentRepository, tokenService }) {
    this.appointmentRepository = appointmentRepository;
    this.tokenService = tokenService;
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

    await this.appointmentRepository.update(payload.appointment_id, { status: 'cancelado' });

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
    });

    return {
      patientName: newAppointment.patient.name,
      date: newAppointment.date,
      time: newAppointment.time,
    };
  }
}

module.exports = RescheduleByTokenOperation;
