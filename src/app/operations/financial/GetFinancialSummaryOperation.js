class GetFinancialSummaryOperation {
  constructor({ appointmentRepository, shiftRepository, userRepository }) {
    this.appointmentRepository = appointmentRepository;
    this.shiftRepository = shiftRepository;
    this.userRepository = userRepository;
  }

  async execute({ doctor_id, view = 'mensal', month, year }) {
    const { from, to, targetMonth } = this._getRange(view, month, year);
    const appointments = await this.appointmentRepository.findByDoctorAndDateRange(doctor_id, from, to);
    const realized = appointments.filter(a => a.status === 'realizado');

    // Plantão só é consultado pra quem ativou a feature (zero custo extra pra
    // quem não usa). Sem plantão, o bloco `plantao` vem todo zerado.
    const user = await this.userRepository.findById(doctor_id);
    const realizedShifts = user?.plantaoEnabled
      ? (await this.shiftRepository.findByDoctorAndDateRange(doctor_id, from, to))
          .filter(s => s.status === 'realizado')
      : [];

    // Três recortes independentes: consulta, plantão e a soma dos dois. O
    // frontend escolhe qual mostrar pelo "modo de atendimento" (só consulta /
    // só plantão / ambos, com o toggle Tudo/Consultas/Plantão). Cada bloco é
    // fechado em si: o total de "consulta" nunca inclui plantão e vice-versa.
    //
    // A soma continua em JS de propósito: o array já está todo em memória
    // porque `entries` (a lista de lançamentos) precisa dos documentos
    // completos de qualquer jeito. Quando `entries` virar paginado, o miolo do
    // _block troca por um $group no Mongo sem mudar o formato da resposta.
    const consulta = this._block(realized, view, targetMonth);
    const plantao = { ...this._block(realizedShifts, view, targetMonth), count: realizedShifts.length };
    const tudo = this._block([...realized, ...realizedShifts], view, targetMonth);

    // Ticket médio e % presencial são métricas de consulta por natureza
    // (plantão não tem "atendimento" nem modalidade). Ficam fora dos blocos,
    // no topo, e o front só as usa nos recortes "consulta" e "tudo".
    const paidAppointments = realized.filter(a => (a.paidValue || 0) > 0);
    const averageTicket = paidAppointments.length > 0
      ? Math.round(paidAppointments.reduce((s, a) => s + a.paidValue, 0) / paidAppointments.length)
      : 0;

    const presencialCount = realized.filter(a => a.type === 'presencial').length;
    const presencialPercentage = realized.length > 0
      ? Math.round((presencialCount / realized.length) * 100) : 0;

    const appointmentEntries = realized.map(a => ({
      id: a.appointment_id,
      kind: 'appointment',
      patientName: a.patient.name,
      locationName: null,
      date: a.date,
      value: a.paidValue || 0,
      netValue: a.netValue ?? (a.paidValue || 0),
      paymentMethod: a.paymentMethod || null,
      paymentStatus: a.paidValue > 0 ? 'recebido' : 'pendente',
      type: a.type,
    }));

    const shiftEntries = realizedShifts.map(s => ({
      id: s.shift_id,
      kind: 'shift',
      patientName: null,
      locationName: s.locationName,
      date: s.date,
      value: s.paidValue || 0,
      netValue: s.netValue ?? (s.paidValue || 0),
      paymentMethod: s.paymentMethod || null,
      paymentStatus: s.paidValue > 0 ? 'recebido' : 'pendente',
      type: null,
    }));

    const entries = [...appointmentEntries, ...shiftEntries].sort((a, b) => b.date.localeCompare(a.date));

    return { consulta, plantao, tudo, averageTicket, presencialPercentage, entries };
  }

  // Totais + gráfico de um conjunto de lançamentos realizados (consulta OU
  // plantão OU os dois juntos). Consulta e plantão têm os mesmos campos
  // relevantes: estimatedValue, paidValue, netValue, date.
  _block(items, view, targetMonth) {
    // netValue só passou a ser salvo depois da feature de taxa — sem ele, cai
    // pro valor bruto (não havia taxa então).
    const totalBilled   = items.reduce((s, x) => s + (x.estimatedValue || 0), 0);
    const totalReceived = items.reduce((s, x) => s + (x.paidValue || 0), 0);
    const totalNet      = items.reduce((s, x) => s + (x.netValue ?? x.paidValue ?? 0), 0);
    // F01: pendente nunca negativo (paidValue pode superar estimatedValue)
    const totalPending  = Math.max(0, totalBilled - totalReceived);
    const chartData = view === 'anual'
      ? this._groupByMonth(items)
      : this._groupByDay(items, targetMonth);
    return { totalBilled, totalReceived, totalNet, totalPending, chartData };
  }

  // F04: aceita year para visão anual
  _getRange(view, month, year) {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (view === 'anual') {
      const targetYear = year ? parseInt(year, 10) : currentYear;
      return {
        from: `${targetYear}-01-01`,
        to:   `${targetYear}-12-31`,
        targetMonth: null,
      };
    }

    // mensal
    const targetMonth = month || `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [y, m] = targetMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return {
      from: `${targetMonth}-01`,
      to:   `${targetMonth}-${String(lastDay).padStart(2, '0')}`,
      targetMonth,
    };
  }

  // Recebe consulta + plantão realizados — ambos têm `date` (YYYY-MM-DD) e
  // `paidValue`. Plantão que cruza meses/dias entra pela data de início.
  _groupByMonth(items) {
    const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const map = Object.fromEntries(names.map(n => [n, 0]));
    items.forEach(x => {
      const idx = parseInt(x.date.split('-')[1], 10) - 1;
      map[names[idx]] += (x.paidValue || 0);
    });
    return names.map(label => ({ label, value: map[label] }));
  }

  _groupByDay(items, targetMonth) {
    const [y, m] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) map[d] = 0;
    items.forEach(x => {
      const day = parseInt(x.date.split('-')[2], 10);
      map[day] = (map[day] || 0) + (x.paidValue || 0);
    });
    return Object.entries(map).map(([day, value]) => ({ label: String(day), value }));
  }
}

module.exports = GetFinancialSummaryOperation;
