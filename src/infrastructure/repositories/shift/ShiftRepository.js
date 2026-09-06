const Shift = require('../../../database/models/shift/shiftModel');

// Filtro que inclui um plantão "em andamento": além do que começa dentro da
// janela pedida, também pega o que começou ANTES da janela mas ainda não
// terminou (endDate cai dentro ou depois do início da janela). Cobre qualquer
// duração — não é só "1 dia antes", um plantão de vários dias cai aqui igual.
function overnightAwareDateFilter({ date, from, to }) {
  if (date) {
    return { $or: [{ date }, { date: { $lt: date }, endDate: { $gte: date } }] };
  }
  if (from || to) {
    const rangeClause = {};
    if (from) rangeClause.$gte = from;
    if (to) rangeClause.$lte = to;
    const clauses = [{ date: rangeClause }];
    if (from) clauses.push({ date: { $lt: from }, endDate: { $gte: from } });
    return { $or: clauses };
  }
  return {};
}

class ShiftRepository {
  async findById(shift_id) {
    return Shift.findOne({ shift_id });
  }

  async findAll({ doctor_id, date, status, from, to }) {
    const filter = { doctor_id, ...overnightAwareDateFilter({ date, from, to }) };
    if (status) filter.status = status;
    // Mesmo teto de segurança usado em AppointmentRepository/PatientRepository.
    return Shift.find(filter).sort({ date: 1, time: 1 }).limit(2000);
  }

  async findByDoctorAndDateRange(doctor_id, from, to) {
    const filter = { doctor_id, ...overnightAwareDateFilter({ from, to }) };
    return Shift.find(filter).sort({ date: 1, time: 1 });
  }

  async create(data) {
    const shift = new Shift(data);
    return shift.save();
  }

  async update(shift_id, data) {
    return Shift.findOneAndUpdate({ shift_id }, data, { new: true });
  }

  async delete(shift_id) {
    return Shift.findOneAndDelete({ shift_id });
  }

  async findBySeriesId(seriesId) {
    return Shift.find({ seriesId }).sort({ date: 1, time: 1 });
  }

  async deleteFutureInSeries(seriesId, fromDate) {
    return Shift.deleteMany({ seriesId, date: { $gte: fromDate }, status: { $ne: 'realizado' } });
  }

  async updateFutureInSeries(seriesId, fromDate, data) {
    return Shift.updateMany(
      { seriesId, date: { $gte: fromDate }, status: { $ne: 'realizado' } },
      { $set: data }
    );
  }
}

module.exports = ShiftRepository;
