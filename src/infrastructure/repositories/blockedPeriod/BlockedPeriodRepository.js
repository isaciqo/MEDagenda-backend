const BlockedPeriod = require('../../../database/models/blockedPeriod/blockedPeriodModel');

class BlockedPeriodRepository {
  async findById(blocked_id) {
    return BlockedPeriod.findOne({ blocked_id });
  }

  // Só datas futuras (ou de hoje em diante) — bloqueio de dia passado não tem
  // efeito nenhum na disponibilidade, só polui a lista de gerenciamento.
  async findUpcomingByDoctor(doctor_id, fromDate) {
    return BlockedPeriod.find({ doctor_id, date: { $gte: fromDate } }).sort({ date: 1, startTime: 1 });
  }

  async findByDoctorAndDateRange(doctor_id, from, to) {
    return BlockedPeriod.find({ doctor_id, date: { $gte: from, $lte: to } });
  }

  async create(data) {
    const blocked = new BlockedPeriod(data);
    return blocked.save();
  }

  async delete(blocked_id) {
    return BlockedPeriod.findOneAndDelete({ blocked_id });
  }
}

module.exports = BlockedPeriodRepository;
