const { v4: uuidv4 } = require('uuid');

class CreateBlockedPeriodOperation {
  constructor({ blockedPeriodRepository }) {
    this.blockedPeriodRepository = blockedPeriodRepository;
  }

  async execute({ doctor_id, date, allDay, startTime, endTime, reason }) {
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      const error = new Error('Não é possível bloquear uma data no passado');
      error.statusCode = 400;
      throw error;
    }

    if (!allDay && (!startTime || !endTime || startTime >= endTime)) {
      const error = new Error('Informe um horário de início anterior ao horário de término');
      error.statusCode = 400;
      throw error;
    }

    const blocked = await this.blockedPeriodRepository.create({
      blocked_id: uuidv4(),
      doctor_id,
      date,
      allDay: !!allDay,
      startTime: allDay ? null : startTime,
      endTime: allDay ? null : endTime,
      reason: reason || '',
    });

    return {
      id: blocked.blocked_id,
      date: blocked.date,
      allDay: blocked.allDay,
      startTime: blocked.startTime,
      endTime: blocked.endTime,
      reason: blocked.reason || '',
    };
  }
}

module.exports = CreateBlockedPeriodOperation;
