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
