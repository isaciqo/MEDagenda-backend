const logger = require('../../../lib/logger');

class UpdateAppointmentOperation {
  constructor({ appointmentRepository, patientRepository, userRepository, planService }) {
    this.appointmentRepository = appointmentRepository;
    this.patientRepository = patientRepository;
    this.userRepository = userRepository;
    this.planService = planService;
  }

  async execute(appointment_id, doctor_id, { type, date, time, estimatedValue, notes, location, duration }) {
    const existing = await this.appointmentRepository.findById(appointment_id);
    if (!existing) {
      const error = new Error('Consulta não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (existing.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    // RN-04: evita bypass do limite mensal movendo consulta para mês já lotado
    if (date !== undefined) {
      const existingYM = existing.date.slice(0, 7);
      const newYM = date.slice(0, 7);
      if (newYM !== existingYM) {
        const user = await this.userRepository.findById(doctor_id);
        const [newYear, newMonth] = newYM.split('-').map(Number);
        const targetCount = await this.appointmentRepository.countByDoctorAndMonth(doctor_id, newYear, newMonth);
        this.planService.canCreateAppointment(user, targetCount, 1);
      }
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue;
    if (notes !== undefined) updateData.notes = notes;
    if (location !== undefined) updateData.location = location;
    if (duration !== undefined) updateData.duration = duration;

    const updated = await this.appointmentRepository.update(appointment_id, updateData);

    // Mesma lógica do CreateAppointmentOperation: mantém o "último local" do
    // paciente sincronizado quando o médico corrige o endereço numa consulta já
    // existente, não só na criação. Best-effort — não pode derrubar o update principal.
    const effectiveType = type !== undefined ? type : existing.type;
    if (location !== undefined && effectiveType === 'presencial' && location.trim()) {
      try {
        await this.patientRepository.update(existing.patient.id, { lastLocation: location });
      } catch (err) {
        logger.error('appointment.update: falha ao salvar lastLocation do paciente', {
          patient_id: existing.patient.id,
          error: err.message,
        });
      }
    }

    return {
      id: updated.appointment_id,
      patient: updated.patient,
      type: updated.type,
      date: updated.date,
      time: updated.time,
      estimatedValue: updated.estimatedValue,
      paidValue: updated.paidValue,
      paymentMethod: updated.paymentMethod,
      paymentDate: updated.paymentDate,
      status: updated.status,
      notes: updated.notes,
      location: updated.location || '',
      duration: updated.duration ?? null,
      meetingLink: updated.meetingLink ?? null,
      isReturn: updated.isReturn ?? false,
      returnOf: updated.returnOf ?? null,
      seriesId: updated.seriesId ?? null,
      seriesIndex: updated.seriesIndex ?? null,
      seriesTotalSessions: updated.seriesTotalSessions ?? null,
    };
  }
}

module.exports = UpdateAppointmentOperation;
