class GetDashboardStatsOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(doctor_id, { view = 'mensal', month, year } = {}) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Compute period range for filtered metrics
    let from, to;
    if (view === 'anual') {
      const targetYear = year ? parseInt(year, 10) : now.getFullYear();
      from = `${targetYear}-01-01`;
      to   = `${targetYear}-12-31`;
    } else {
      const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const [y, m] = targetMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      from = `${targetMonth}-01`;
      to   = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;
    }

    // Single query: from earliest(period_start, today) to 1 year ahead
    const futureEnd = new Date(now);
    futureEnd.setFullYear(futureEnd.getFullYear() + 1);
    const queryFrom = today < from ? today : from;
    const queryTo   = futureEnd.toISOString().split('T')[0];

    const all = await this.appointmentRepository.findByDoctorAndDateRange(doctor_id, queryFrom, queryTo);

    // --- Context-independent: always based on today ---
    const todayAppointments = all.filter(a => a.date === today && a.status !== 'cancelado').length;

    const nextAppointment = (() => {
      const upcoming = all
        .filter(a => a.date >= today && a.status !== 'cancelado')
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      return upcoming.length > 0
        ? { patientName: upcoming[0].patient.name, date: upcoming[0].date, time: upcoming[0].time }
        : null;
    })();

    // --- Period-filtered metrics ---
    const period    = all.filter(a => a.date >= from && a.date <= to);
    const realized  = period.filter(a => a.status === 'realizado');

    const periodRevenue = realized.reduce((s, a) => s + (a.paidValue || 0), 0);

    const patientSet = new Set(realized.map(a => a.patient.id));
    const returningIds = new Set(
      realized
        .filter(a => realized.filter(b => b.patient.id === a.patient.id).length > 1)
        .map(a => a.patient.id)
    );
    const returnRate = patientSet.size > 0 ? Math.round((returningIds.size / patientSet.size) * 100) : 0;

    const chartData      = view === 'anual' ? this._monthlyChart(period) : this._weeklyChart(period, from);
    const typeDistribution = this._typeDistribution(period);

    return { todayAppointments, periodRevenue, nextAppointment, returnRate, chartData, typeDistribution, view };
  }

  _weeklyChart(appointments, monthFrom) {
    const [y, m] = monthFrom.split('-').map(Number);
    const endOfMonth = new Date(y, m, 0).getDate();
    const pad = n => String(n).padStart(2, '0');
    const weeks = [];
    for (let w = 0; ; w++) {
      const dayStart = 1 + w * 7;
      if (dayStart > endOfMonth) break;
      const dayEnd   = Math.min(dayStart + 6, endOfMonth);
      const startStr = `${y}-${pad(m)}-${pad(dayStart)}`;
      const endStr   = `${y}-${pad(m)}-${pad(dayEnd)}`;
      const count = appointments.filter(a => a.date >= startStr && a.date <= endStr && a.status !== 'cancelado').length;
      weeks.push({ label: `Sem ${w + 1}`, count });
    }
    return weeks;
  }

  _monthlyChart(appointments) {
    const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const map = Object.fromEntries(names.map(n => [n, 0]));
    appointments.filter(a => a.status !== 'cancelado').forEach(a => {
      const idx = parseInt(a.date.split('-')[1], 10) - 1;
      map[names[idx]] += 1;
    });
    return names.map(label => ({ label, count: map[label] }));
  }

  _typeDistribution(appointments) {
    const active = appointments.filter(a => a.status !== 'cancelado');
    const total = active.length;
    if (total === 0) return [];
    const presencial = active.filter(a => a.type === 'presencial').length;
    const online     = active.filter(a => a.type === 'online').length;
    return [
      // Paleta única CliniQ (DESIGN_SYSTEM.md) — blue-500 e blue-300, não cores genéricas.
      { name: 'Presencial', value: Math.round((presencial / total) * 100), fill: 'hsl(216, 40%, 37%)' },
      { name: 'Online',     value: Math.round((online     / total) * 100), fill: 'hsl(215, 58%, 71%)' },
    ];
  }
}

module.exports = GetDashboardStatsOperation;
