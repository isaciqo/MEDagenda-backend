class GetFinancialSummaryOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ doctor_id, period = 'mes' }) {
    const { from, to } = this._getPeriodRange(period);
    const appointments = await this.appointmentRepository.findByDoctorAndDateRange(doctor_id, from, to);
    const realized = appointments.filter(a => a.status === 'realizado');

    const totalBilled = realized.reduce((sum, a) => sum + (a.estimatedValue || 0), 0);
    const totalReceived = realized.reduce((sum, a) => sum + (a.paidValue || 0), 0);
    const totalPending = totalBilled - totalReceived;
    const averageTicket = realized.length > 0 ? Math.round(totalReceived / realized.length) : 0;
    const presencialCount = realized.filter(a => a.type === 'presencial').length;
    const presencialPercentage = realized.length > 0 ? Math.round((presencialCount / realized.length) * 100) : 0;

    const monthlyRevenue = this._groupByMonth(realized);

    const entries = realized.map(a => ({
      id: a.appointment_id,
      patientName: a.patient.name,
      date: a.date,
      value: a.paidValue || 0,
      paymentStatus: a.paidValue > 0 ? 'recebido' : 'pendente',
      type: a.type,
    }));

    return {
      totalBilled,
      totalReceived,
      totalPending,
      averageTicket,
      presencialPercentage,
      monthlyRevenue,
      entries,
    };
  }

  _getPeriodRange(period) {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    let from;

    if (period === 'semana') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      from = d.toISOString().split('T')[0];
    } else if (period === 'trimestre') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      from = d.toISOString().split('T')[0];
    } else if (period === 'ano') {
      from = `${now.getFullYear()}-01-01`;
    } else {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    return { from, to };
  }

  _groupByMonth(appointments) {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const map = {};

    appointments.forEach(a => {
      const month = monthNames[parseInt(a.date.split('-')[1], 10) - 1];
      map[month] = (map[month] || 0) + (a.paidValue || 0);
    });

    return Object.entries(map).map(([month, value]) => ({ month, value }));
  }
}

module.exports = GetFinancialSummaryOperation;
