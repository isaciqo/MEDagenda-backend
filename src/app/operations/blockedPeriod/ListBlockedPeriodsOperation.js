class ListBlockedPeriodsOperation {
  constructor({ blockedPeriodRepository }) {
    this.blockedPeriodRepository = blockedPeriodRepository;
  }

  async execute(doctor_id) {
    const today = new Date().toISOString().split('T')[0];
    const blocks = await this.blockedPeriodRepository.findUpcomingByDoctor(doctor_id, today);
    return blocks.map(this._format);
  }

  _format(b) {
    return {
      id: b.blocked_id,
      date: b.date,
      allDay: b.allDay,
      startTime: b.startTime,
      endTime: b.endTime,
      reason: b.reason || '',
    };
  }
}

module.exports = ListBlockedPeriodsOperation;
