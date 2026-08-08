const { OAuth2Client } = require('google-auth-library');
const logger = require('../../lib/logger');

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const BR_OFFSET = '-03:00';

// Fase 1 usa UMA conta Google compartilhada por TODA a plataforma (ver
// FEATURE_GOOGLE_MEET.md) — um único médico abusivo pode esgotar a cota da API
// pra todo mundo. Os dois mecanismos abaixo (quota por médico + circuit breaker)
// existem só pra conter esse ponto único de falha; ver ANALISE_ABUSO_CUSTO.md,
// Business-Flow-05. Estado em memória — não é perfeito com múltiplas instâncias
// do servidor rodando ao mesmo tempo, mas reduz o dano de forma real mesmo assim.
const PER_DOCTOR_LIMIT = 20;
const PER_DOCTOR_WINDOW_MS = 60 * 60 * 1000;
const doctorCallLog = new Map(); // doctor_id -> timestamps[]

const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000;
let consecutiveFailures = 0;
let circuitOpenUntil = 0;

function checkDoctorQuota(doctorId) {
  if (!doctorId) return; // update/delete não recriam evento — sem quota nova a checar
  const now = Date.now();
  const calls = (doctorCallLog.get(doctorId) || []).filter(t => now - t < PER_DOCTOR_WINDOW_MS);
  if (calls.length >= PER_DOCTOR_LIMIT) {
    throw new Error(`Limite de reuniões automáticas por hora atingido (${PER_DOCTOR_LIMIT}/h)`);
  }
  calls.push(now);
  doctorCallLog.set(doctorId, calls);
}

function checkCircuit() {
  if (Date.now() < circuitOpenUntil) {
    throw new Error('Integração com Google Calendar pausada temporariamente após falhas recentes — tentando novamente em breve');
  }
}

function recordOutcome(ok) {
  if (ok) {
    consecutiveFailures = 0;
    return;
  }
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD && Date.now() >= circuitOpenUntil) {
    circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    logger.error('GoogleCalendarService: circuito aberto após falhas consecutivas', {
      consecutiveFailures,
      cooldown_ms: CIRCUIT_COOLDOWN_MS,
    });
  }
}

// Soma minutos a um par (date: 'YYYY-MM-DD', time: 'HH:mm') sem depender do fuso
// horário local do processo Node — só matemática em UTC, puramente calendário.
function addMinutes(date, time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const dayOverflow = Math.floor(total / (24 * 60));
  const remaining = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const newTime = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  let newDate = date;
  if (dayOverflow !== 0) {
    const [y, mo, d] = date.split('-').map(Number);
    newDate = new Date(Date.UTC(y, mo - 1, d + dayOverflow)).toISOString().slice(0, 10);
  }
  return { date: newDate, time: newTime };
}

class GoogleCalendarService {
  constructor() {
    this.clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    this.refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
  }

  isConfigured() {
    return !!(this.clientId && this.clientSecret && this.refreshToken);
  }

  async _getAccessToken() {
    const client = new OAuth2Client(this.clientId, this.clientSecret);
    client.setCredentials({ refresh_token: this.refreshToken });
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('Falha ao obter access token do Google Calendar');
    return token;
  }

  async _request(path, { method = 'GET', body } = {}) {
    const accessToken = await this._getAccessToken();
    const res = await fetch(`${CALENDAR_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res;
  }

  /**
   * Cria um evento com Google Meet automático (conferenceDataVersion=1) e
   * sendUpdates=none — sem convite nativo do Google pra ninguém (ver FEATURE_GOOGLE_MEET.md).
   * Retorna { eventId, meetingLink }.
   */
  async createMeetEvent({ doctorId, date, time, durationMinutes, summary, description }) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar não configurado (variáveis de ambiente ausentes)');
    }
    checkCircuit();
    checkDoctorQuota(doctorId);

    const { date: endDate, time: endTime } = addMinutes(date, time, durationMinutes);
    const requestId = `cliniq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let res;
    try {
      res = await this._request('/calendars/primary/events?conferenceDataVersion=1&sendUpdates=none', {
        method: 'POST',
        body: {
          summary,
          description,
          start: { dateTime: `${date}T${time}:00${BR_OFFSET}` },
          end: { dateTime: `${endDate}T${endTime}:00${BR_OFFSET}` },
          conferenceData: {
            createRequest: {
              requestId,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        },
      });
    } catch (err) {
      recordOutcome(false);
      throw err;
    }

    if (!res.ok) {
      // 429/403 (quota) merece abrir o circuito mais rápido; outros erros (4xx de
      // payload malformado, por exemplo) também contam pra não mascarar problemas.
      recordOutcome(false);
      throw new Error(`Google Calendar API (create): ${res.status} — ${await res.text()}`);
    }
    recordOutcome(true);

    const event = await res.json();
    const meetingLink =
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri ||
      null;

    return { eventId: event.id, meetingLink };
  }

  async updateMeetEvent(eventId, { date, time, durationMinutes }) {
    if (!this.isConfigured() || !eventId) return;
    checkCircuit();

    const { date: endDate, time: endTime } = addMinutes(date, time, durationMinutes);
    let res;
    try {
      res = await this._request(`/calendars/primary/events/${eventId}?sendUpdates=none`, {
        method: 'PATCH',
        body: {
          start: { dateTime: `${date}T${time}:00${BR_OFFSET}` },
          end: { dateTime: `${endDate}T${endTime}:00${BR_OFFSET}` },
        },
      });
    } catch (err) {
      recordOutcome(false);
      throw err;
    }

    if (!res.ok) {
      recordOutcome(false);
      throw new Error(`Google Calendar API (update): ${res.status} — ${await res.text()}`);
    }
    recordOutcome(true);
  }

  async deleteMeetEvent(eventId) {
    if (!this.isConfigured() || !eventId) return;
    checkCircuit();

    let res;
    try {
      res = await this._request(`/calendars/primary/events/${eventId}?sendUpdates=none`, {
        method: 'DELETE',
      });
    } catch (err) {
      recordOutcome(false);
      throw err;
    }

    // 410/404 = evento já não existe mais — ok, não é erro
    if (!res.ok && res.status !== 410 && res.status !== 404) {
      recordOutcome(false);
      throw new Error(`Google Calendar API (delete): ${res.status} — ${await res.text()}`);
    }
    recordOutcome(true);
  }
}

module.exports = GoogleCalendarService;
