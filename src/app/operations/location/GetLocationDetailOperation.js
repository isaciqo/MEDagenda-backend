// Visão 360º do local: resumo + histórico de consultas e plantões feitos aqui
// + total financeiro. Mesmo raciocínio do GetPatientDetailOperation (merge em
// memória, sem agregação pesada — volume por local é sempre pequeno).
//
// Consulta só casa com o local por nome (só presencial guarda `location`, um
// texto solto, não um id — ver AppointmentRepository.findByLocationName).
// Plantão casa por locationId de verdade.
class GetLocationDetailOperation {
  constructor({ locationRepository, appointmentRepository, shiftRepository, userRepository, planService }) {
    this.locationRepository = locationRepository;
    this.appointmentRepository = appointmentRepository;
    this.shiftRepository = shiftRepository;
    this.userRepository = userRepository;
    this.planService = planService;
  }

  async execute(location_id, doctor_id) {
    const location = await this.locationRepository.findById(location_id);
    if (!location) {
      const error = new Error('Local não encontrado');
      error.statusCode = 404;
      throw error;
    }
    if (location.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    const user = await this.userRepository.findById(doctor_id);
    const hasFinancial = user ? this.planService.hasFeature(user, 'financeiro_completo') : false;

    const appointments = await this.appointmentRepository.findByLocationName(doctor_id, location.name);
    // Pula a consulta ao banco inteira se o médico nunca ativou plantão — zero
    // custo extra pra quem só usa consulta presencial.
    const shifts = user?.plantaoEnabled
      ? await this.shiftRepository.findByLocationId(doctor_id, location.location_id)
      : [];

    const entries = [
      ...appointments.map(a => ({
        id: a.appointment_id,
        kind: 'appointment',
        date: a.date,
        time: a.time,
        endTime: null,
        label: a.patient.name,
        status: a.status,
        paidValue: a.paidValue ?? null,
        notes: a.notes || null,
      })),
      ...shifts.map(s => ({
        id: s.shift_id,
        kind: 'shift',
        date: s.date,
        time: s.time,
        endTime: s.endTime,
        label: null,
        status: s.status,
        paidValue: s.paidValue ?? null,
        notes: s.notes || null,
      })),
    ].sort((x, y) => `${y.date}T${y.time}`.localeCompare(`${x.date}T${x.time}`));

    const totalReceived = entries
      .filter(e => e.status === 'realizado')
      .reduce((sum, e) => sum + (e.paidValue || 0), 0);

    return {
      location: {
        id: location.location_id,
        name: location.name,
        address: location.address || '',
        color: location.color || null,
      },
      summary: {
        totalCount: entries.length,
        lastDate: entries[0] ? entries[0].date : null,
      },
      financialSummary: hasFinancial ? { totalReceived } : null,
      entries,
    };
  }
}

module.exports = GetLocationDetailOperation;
