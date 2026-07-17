class GetFinancialSummaryOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ doctor_id, view = 'mensal', month }) {
    const { from, to, targetMonth } = this._getRange(view, month);
    const appointments = await this.appointmentRepository.findByDoctorAndDateRange(doctor_id, from, to);
    const realized = appointments.filter(a => a.status === 'realizado');

    const totalBilled    = realized.reduce((s, a) => s + (a.estimatedValue || 0), 0);
    const totalReceived  = realized.reduce((s, a) => s + (a.paidValue || 0), 0);
    const totalPending   = totalBilled - totalReceived;
    const averageTicket  = realized.length > 0 ? Math.round(totalReceived / realized.length) : 0;
    const presencialCount = realized.filter(a => a.type === 'presencial').length;
    const presencialPercentage = realized.length > 0
      ? Math.round((presencialCount / realized.length) * 100) : 0;

    const chartData = view === 'anual'
      ? this._groupByMonth(realized)
      : this._groupByDay(realized, targetMonth);

    const entries = realized
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(a => ({
        id: a.appointment_id,
        patientName: a.patient.name,
        date: a.date,
        value: a.paidValue || 0,
        paymentStatus: a.paidValue > 0 ? 'recebido' : 'pendente',
        type: a.type,
      }));

    return { totalBilled, totalReceived, totalPending, averageTicket, presencialPercentage, chartData, entries };
  }

  _getRange(view, month) {
    const now = new Date();
    const year = now.getFullYear();

    if (view === 'anual') {
      return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
        targetMonth: null,
      };
    }

    // mensal
    const targetMonth = month || `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [y, m] = targetMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return {
      from: `${targetMonth}-01`,
      to: `${targetMonth}-${String(lastDay).padStart(2, '0')}`,
      targetMonth,
    };
  }

  _groupByMonth(appointments) {
    const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const map = Object.fromEntries(names.map(n => [n, 0]));
    appointments.forEach(a => {
      const idx = parseInt(a.date.split('-')[1], 10) - 1;
      map[names[idx]] += (a.paidValue || 0);
    });
    return names.map(label => ({ label, value: map[label] }));
  }

  _groupByDay(appointments, targetMonth) {
    const [y, m] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) map[d] = 0;
    appointments.forEach(a => {
      const day = parseInt(a.date.split('-')[2], 10);
      map[day] = (map[day] || 0) + (a.paidValue || 0);
    });
    return Object.entries(map).map(([day, value]) => ({ label: String(day), value }));
  }
}

module.exports = GetFinancialSummaryOperation;
