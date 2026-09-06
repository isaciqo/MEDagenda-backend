class DeleteShiftSeriesOperation {
  constructor({ shiftRepository }) {
    this.shiftRepository = shiftRepository;
  }

  async execute({ doctor_id, seriesId, fromDate }) {
    const shifts = await this.shiftRepository.findBySeriesId(seriesId);
    const toDelete = shifts.filter(
      s => s.doctor_id === doctor_id && s.date >= fromDate && s.status !== 'realizado'
    );
    for (const shift of toDelete) {
      await this.shiftRepository.delete(shift.shift_id);
    }
    return { deleted: toDelete.length };
  }
}

module.exports = DeleteShiftSeriesOperation;
