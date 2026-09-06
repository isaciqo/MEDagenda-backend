class ListShiftsOperation {
  constructor({ shiftRepository }) {
    this.shiftRepository = shiftRepository;
  }

  async execute({ doctor_id, date, status, from, to }) {
    const shifts = await this.shiftRepository.findAll({ doctor_id, date, status, from, to });
    return shifts.map(s => ({
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
    }));
  }
}

module.exports = ListShiftsOperation;
