const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    this.fromEmail = process.env.EMAIL_FROM || 'MedAgenda <noreply@resend.dev>';
  }

  async sendConfirmationEmail({ email, name, token }) {
    const confirmUrl = `${this.frontendUrl}/confirm-email?token=${token}`;
    await this.client.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Confirme seu e-mail - MedAgenda',
      html: `
        <p>Ola, ${name}!</p>
        <p>Clique no link abaixo para confirmar seu e-mail:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>Este link expira em 1 hora.</p>
      `,
    });
  }

  async sendPasswordResetEmail({ email, name, token }) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    await this.client.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Redefinicao de senha - MedAgenda',
      html: `
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
      `,
    });
  }
}

module.exports = EmailService;
