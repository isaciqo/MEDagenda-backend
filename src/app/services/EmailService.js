const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const logger = require('../../lib/logger');

class EmailService {
  constructor() {
    this.client = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS || 'noreply@trial-o65qngkvz4el3zxj.mlsender.net';
    this.fromName = process.env.EMAIL_FROM_NAME || 'MedAgenda';
  }

  async _send(emailParams, context) {
    try {
      const result = await this.client.email.send(emailParams);
      logger.info(`email.send: ${context} enviado com sucesso`);
      return result;
    } catch (err) {
      const body = err.body ?? err.response?.body ?? err.response?.data ?? null;
      logger.error(`email.send: falha ao enviar ${context}`, {
        message: err.message,
        status: err.statusCode ?? err.status ?? null,
        body: body ? JSON.stringify(body) : null,
      });
      throw err;
    }
  }

  async sendConfirmationEmail({ email, name, token }) {
    const confirmUrl = `${this.frontendUrl}/confirm-email?token=${token}`;
    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(email, name)])
      .setSubject('Confirme seu e-mail - MedAgenda')
      .setHtml(`
        <p>Ola, ${name}!</p>
        <p>Clique no link abaixo para confirmar seu e-mail:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>Este link expira em 1 hora.</p>
      `);

    return this._send(emailParams, `confirmacao para ${email}`);
  }

  async sendTrialExpiryWarning({ email, name, daysLeft, upgradeUrl }) {
    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(email, name)])
      .setSubject(`Seu período de teste termina em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} — CliniQ`)
      .setHtml(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:#2563eb;padding:32px 40px;text-align:center;">
                    <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">CliniQ</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;">
                      Olá, ${name}!
                    </p>
                    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
                      Seu período de teste gratuito do CliniQ termina em
                      <strong style="color:#111827;">${daysLeft} dia${daysLeft !== 1 ? 's' : ''}</strong>.
                      Não perca o acesso à sua agenda e aos seus dados.
                    </p>

                    <!-- Warning box -->
                    <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                        ⚠️ Após o término do teste, sua conta entrará em modo expirado e você não conseguirá criar novas consultas.
                      </p>
                    </div>

                    <!-- Plans summary -->
                    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">
                      Escolha um plano
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="width:48%;border:1px solid #e5e7eb;border-radius:8px;padding:16px;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Essencial</p>
                          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#2563eb;">R$34,90<span style="font-size:12px;font-weight:400;color:#6b7280;">/mês</span></p>
                          <p style="margin:0;font-size:12px;color:#6b7280;">Até 80 consultas/mês</p>
                        </td>
                        <td style="width:4%;"></td>
                        <td style="width:48%;border:2px solid #2563eb;border-radius:8px;padding:16px;vertical-align:top;background:#eff6ff;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#2563eb;text-transform:uppercase;">Mais popular</p>
                          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Profissional</p>
                          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#2563eb;">R$49,90<span style="font-size:12px;font-weight:400;color:#6b7280;">/mês</span></p>
                          <p style="margin:0;font-size:12px;color:#6b7280;">Consultas ilimitadas + WhatsApp</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <div style="text-align:center;">
                      <a href="${upgradeUrl}"
                        style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:-0.2px;">
                        Fazer upgrade agora
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      Você está recebendo este e-mail porque possui uma conta no CliniQ.<br>
                      <a href="${this.frontendUrl}" style="color:#6b7280;">Acessar o CliniQ</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `);

    return this._send(emailParams, `aviso de trial expirando para ${email}`);
  }

  async sendPasswordResetEmail({ email, name, token }) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(email, name)])
      .setSubject('Redefinicao de senha - MedAgenda')
      .setHtml(`
        <p>Ola, ${name}!</p>
        <p>Clique no botao abaixo para redefinir sua senha:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
            Redefinir senha
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;">
          Este link expira em 1 hora. Se voce nao solicitou a redefinicao, ignore este e-mail.
        </p>
      `);

    return this._send(emailParams, `reset de senha para ${email}`);
  }
}

module.exports = EmailService;
