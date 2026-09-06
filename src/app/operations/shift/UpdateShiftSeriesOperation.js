// Só valor e anotação — diferente de UpdateAppointmentSeriesOperation (que
// também deixa mexer em time/location), porque uma série de plantão
// compartilha o mesmo local por construção, e editar o horário em massa não
// faz sentido do mesmo jeito (cada ocorrência já tem seu próprio horário fixo
// vindo da recorrência).
const ALLOWED_FIELDS = ['estimatedValue', 'notes'];

class UpdateShiftSeriesOperation {
  constructor({ shiftRepository }) {
    this.shiftRepository = shiftRepository;
  }

  async execute({ doctor_id, seriesId, fromDate, data }) {
    const shifts = await this.shiftRepository.findBySeriesId(seriesId);
    const toUpdate = shifts.filter(
      s => s.doctor_id === doctor_id && s.date >= fromDate && s.status !== 'realizado'
    );

    const updateData = {};
    for (const key of ALLOWED_FIELDS) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }

    for (const shift of toUpdate) {
      await this.shiftRepository.update(shift.shift_id, updateData);
    }
    return { updated: toUpdate.length };
  }
}

module.exports = UpdateShiftSeriesOperation;
