const { OAuth2Client } = require('google-auth-library');

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const BR_OFFSET = '-03:00';

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
  async createMeetEvent({ date, time, durationMinutes, summary, description }) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar não configurado (variáveis de ambiente ausentes)');
    }

    const { date: endDate, time: endTime } = addMinutes(date, time, durationMinutes);
    const requestId = `cliniq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const res = await this._request('/calendars/primary/events?conferenceDataVersion=1&sendUpdates=none', {
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

    if (!res.ok) {
      throw new Error(`Google Calendar API (create): ${res.status} — ${await res.text()}`);
    }

    const event = await res.json();
    const meetingLink =
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri ||
      null;

    return { eventId: event.id, meetingLink };
  }

  async updateMeetEvent(eventId, { date, time, durationMinutes }) {
    if (!this.isConfigured() || !eventId) return;

    const { date: endDate, time: endTime } = addMinutes(date, time, durationMinutes);
    const res = await this._request(`/calendars/primary/events/${eventId}?sendUpdates=none`, {
      method: 'PATCH',
      body: {
        start: { dateTime: `${date}T${time}:00${BR_OFFSET}` },
        end: { dateTime: `${endDate}T${endTime}:00${BR_OFFSET}` },
      },
    });

    if (!res.ok) {
      throw new Error(`Google Calendar API (update): ${res.status} — ${await res.text()}`);
    }
  }

  async deleteMeetEvent(eventId) {
    if (!this.isConfigured() || !eventId) return;

    const res = await this._request(`/calendars/primary/events/${eventId}?sendUpdates=none`, {
      method: 'DELETE',
    });

    // 410/404 = evento já não existe mais — ok, não é erro
    if (!res.ok && res.status !== 410 && res.status !== 404) {
      throw new Error(`Google Calendar API (delete): ${res.status} — ${await res.text()}`);
    }
  }
}

module.exports = GoogleCalendarService;
