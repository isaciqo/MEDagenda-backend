class UpdateShiftOperation {
  constructor({ shiftRepository, locationRepository }) {
    this.shiftRepository = shiftRepository;
    this.locationRepository = locationRepository;
  }

  async execute(shift_id, doctor_id, { locationId, date, time, endDate, endTime, estimatedValue, notes }) {
    const existing = await this.shiftRepository.findById(shift_id);
    if (!existing) {
      const error = new Error('Plantão não encontrado');
      error.statusCode = 404;
      throw error;
    }
    if (existing.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    const updateData = {};
    if (locationId !== undefined && locationId !== existing.locationId) {
      const location = await this.locationRepository.findById(locationId);
      if (!location || location.doctor_id !== doctor_id) {
        const error = new Error('Local não encontrado');
        error.statusCode = 404;
        throw error;
      }
      updateData.locationId = location.location_id;
      updateData.locationName = location.name;
      updateData.locationColor = location.color;
    }
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await this.shiftRepository.update(shift_id, updateData);

    return {
      id: updated.shift_id,
      locationId: updated.locationId,
      locationName: updated.locationName,
      locationColor: updated.locationColor,
      date: updated.date,
      time: updated.time,
      endDate: updated.endDate,
      endTime: updated.endTime,
      estimatedValue: updated.estimatedValue,
      paidValue: updated.paidValue,
      netValue: updated.netValue,
      paymentMethod: updated.paymentMethod,
      paymentDate: updated.paymentDate,
      status: updated.status,
      notes: updated.notes,
      seriesId: updated.seriesId ?? null,
      seriesIndex: updated.seriesIndex ?? null,
      seriesTotalSessions: updated.seriesTotalSessions ?? null,
    };
  }
}

module.exports = UpdateShiftOperation;
