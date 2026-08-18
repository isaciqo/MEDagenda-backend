const DAY_KEYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

/**
 * Única fonte de verdade pra tudo que envolve o expediente configurado pelo médico
 * (user.schedule). Antes desse service, "dia da semana -> config do dia -> horários
 * livres" estava reimplementado quase igual em GetAvailabilitySlotsOperation,
 * GetPublicSlotsOperation e CreateAppointmentSeriesOperation — inclusive a checagem de
 * disponibilidade por dia nunca existia na criação de série, só o ajuste de horário
 * dentro do mesmo dia (por isso uma recorrência mensal podia cair num domingo fechado).
 */
class ScheduleService {
  getDaySchedule(schedule, date) {
    if (!schedule) return undefined;
    const dayKey = DAY_KEYS[new Date(date + 'T00:00:00').getDay()];
    return schedule instanceof Map ? schedule.get(dayKey) : schedule[dayKey];
  }

  isDayEnabled(schedule, date) {
    return !!this.getDaySchedule(schedule, date)?.enabled;
  }

  isSlotOpen(schedule, date, time) {
    const daySchedule = this.getDaySchedule(schedule, date);
    if (!daySchedule?.enabled) return false;
    const mins = this._parseTime(time);
    return mins >= this._parseTime(daySchedule.start) && mins < this._parseTime(daySchedule.end);
  }

  generateDaySlots(daySchedule, durationMinutes) {
    const slots = [];
    let mins = this._parseTime(daySchedule.start);
    const endMins = this._parseTime(daySchedule.end);
    while (mins < endMins) {
      slots.push(this._formatTime(mins));
      mins += durationMinutes;
    }
    return slots;
  }

  addMinutes(time, minutes) {
    return this._formatTime(this._parseTime(time) + minutes);
  }

  /**
   * Anda pra frente a partir de `date` (exclusive) até achar um dia habilitado.
   * Não altera `date` em si — quem chama decide o que fazer com o resultado — o que
   * mantém a âncora da série intacta: as próximas sessões continuam calculadas a partir
   * do padrão original (semanal/quinzenal/mensal), não a partir da data ajustada.
   */
  findNextEnabledDate(schedule, date, maxDays = 14) {
    const cursor = new Date(date + 'T00:00:00');
    for (let i = 0; i < maxDays; i++) {
      cursor.setDate(cursor.getDate() + 1);
      const candidate = cursor.toISOString().split('T')[0];
      if (this.isDayEnabled(schedule, candidate)) return candidate;
    }
    return null;
  }

  findNextFreeTime(existingAppointments, date, startTime, durationMinutes, schedule) {
    const daySchedule = this.getDaySchedule(schedule, date);
    const endMins = daySchedule?.enabled ? this._parseTime(daySchedule.end) : this._parseTime('23:00');
    let mins = this._parseTime(startTime) + durationMinutes;

    for (let i = 0; i < 20; i++) {
      if (mins >= endMins) break;
      const candidate = this._formatTime(mins);
      const conflict = existingAppointments.find(
        a => a.date === date && a.time === candidate && a.status !== 'cancelado'
      );
      if (!conflict) return candidate;
      mins += durationMinutes;
    }
    return startTime;
  }

  /**
   * Sem duração própria por consulta, todo agendamento é tratado como ocupando
   * `durationMinutes` (a duração padrão do médico) a partir do seu horário — por
   * isso um conflito não é "mesmo horário exato", é qualquer sobreposição de
   * intervalo (ex: consulta às 11:33 de 30min bloqueia 11:30 e 12:00 também).
   */
  hasOverlap(appointments, date, time, durationMinutes) {
    const candidateStart = this._parseTime(time);
    const candidateEnd = candidateStart + durationMinutes;
    return appointments.some(a => {
      if (a.date !== date || a.status === 'cancelado') return false;
      const bookedStart = this._parseTime(a.time);
      const bookedEnd = bookedStart + durationMinutes;
      return candidateStart < bookedEnd && candidateEnd > bookedStart;
    });
  }

  _parseTime(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  _formatTime(mins) {
    return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  }
}

module.exports = ScheduleService;
