class GetDashboardStatsOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(doctor_id) {
    const today = new Date().toISOString().split('T')[0];
    const allAppointments = await this.appointmentRepository.findAll({ doctor_id });

    const todayAppointments = allAppointments.filter(a => a.date === today && a.status !== 'cancelado').length;

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthRealized = allAppointments.filter(
      a => a.date >= monthStart && a.date <= today && a.status === 'realizado'
    );
    const monthRevenue = monthRealized.reduce((sum, a) => sum + (a.paidValue || 0), 0);

    const upcoming = allAppointments
      .filter(a => a.date >= today && a.status !== 'cancelado')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const nextAppointment = upcoming.length > 0
      ? { patientName: upcoming[0].patient.name, time: upcoming[0].time }
      : null;

    const realized = allAppointments.filter(a => a.status === 'realizado');
    const patientSet = new Set(realized.map(a => a.patient.phone));
    const returning = realized.filter(a => {
      const samePatient = realized.filter(b => b.patient.phone === a.patient.phone);
      return samePatient.length > 1;
    });
    const returnRate = patientSet.size > 0
      ? Math.round((new Set(returning.map(a => a.patient.phone)).size / patientSet.size) * 100)
      : 0;

    const weeklyAppointments = this._getWeeklyStats(allAppointments, now);
    const typeDistribution = this._getTypeDistribution(allAppointments);

    return {
      todayAppointments,
      monthRevenue,
      nextAppointment,
      returnRate,
      weeklyAppointments,
      typeDistribution,
    };
  }

  _getWeeklyStats(appointments, now) {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startStr = weekStart.toISOString().split('T')[0];
      const endStr = weekEnd.toISOString().split('T')[0];

      const count = appointments.filter(
        a => a.date >= startStr && a.date <= endStr && a.status !== 'cancelado'
      ).length;

      weeks.push({ week: `Sem ${4 - i}`, count });
    }
    return weeks;
  }

  _getTypeDistribution(appointments) {
    const active = appointments.filter(a => a.status !== 'cancelado');
    const total = active.length;
    if (total === 0) return [];

    const presencial = active.filter(a => a.type === 'presencial').length;
    const online = total - presencial;

    return [
      { name: 'Presencial', value: Math.round((presencial / total) * 100), fill: 'hsl(221, 83%, 53%)' },
      { name: 'Online', value: Math.round((online / total) * 100), fill: 'hsl(142, 71%, 45%)' },
    ];
  }
}

module.exports = GetDashboardStatsOperation;
