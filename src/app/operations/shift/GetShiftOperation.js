class GetShiftOperation {
  constructor({ shiftRepository }) {
    this.shiftRepository = shiftRepository;
  }

  async execute(shift_id, doctor_id) {
    const s = await this.shiftRepository.findById(shift_id);
    if (!s) {
      const error = new Error('Plantão não encontrado');
      error.statusCode = 404;
      throw error;
    }
    if (s.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    return {
      id: s.shift_id,
      locationId: s.locationId,
      locationName: s.locationName,
      locationColor: s.locationColor,
      date: s.date,
      time: s.time,
      endDate: s.endDate,
      endTime: s.endTime,
      estimatedValue: s.estimatedValue,
      paidValue: s.paidValue,
      netValue: s.netValue,
      paymentMethod: s.paymentMethod,
      paymentDate: s.paymentDate,
      status: s.status,
      notes: s.notes,
      seriesId: s.seriesId ?? null,
      seriesIndex: s.seriesIndex ?? null,
      seriesTotalSessions: s.seriesTotalSessions ?? null,
    };
  }
}

module.exports = GetShiftOperation;
