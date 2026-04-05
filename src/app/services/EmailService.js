const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

class EmailService {
  constructor() {
    this.client = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS || 'noreply@trial-o65qngkvz4el3zxj.mlsender.net';
    this.fromName = process.env.EMAIL_FROM_NAME || 'MedAgenda';
  }

  async sendConfirmationEmail({ email, name, token }) {
    const confirmUrl = `${this.frontendUrl}/confirm-email?token=${token}`;
    const sender = new Sender(this.fromEmail, this.fromName);
    const recipients = [new Recipient(email, name)];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject('Confirme seu e-mail - MedAgenda')
      .setHtml(`
        <p>Ola, ${name}!</p>
        <p>Clique no link abaixo para confirmar seu e-mail:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>Este link expira em 1 hora.</p>
      `);

    return this.client.email.send(emailParams);
  }

  async sendPasswordResetEmail({ email, name, token }) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const sender = new Sender(this.fromEmail, this.fromName);
    const recipients = [new Recipient(email, name)];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
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

    return this.client.email.send(emailParams);
  }
}

module.exports = EmailService;
