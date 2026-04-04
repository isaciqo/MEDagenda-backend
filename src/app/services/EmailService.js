const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────
// EmailService
//
// Atualmente usa nodemailer via SMTP (serviço gratuito, ex: Gmail,
// Brevo SMTP, Mailgun SMTP, Ethereal para testes).
//
// Para trocar para uma API de email (Resend, Brevo API, SendGrid):
//   1. Instale o SDK do provedor escolhido.
//   2. Crie uma classe que implemente os mesmos métodos:
//        sendPasswordResetEmail({ email, name, token })
//        sendConfirmationEmail({ email, name, token })
//   3. Substitua a instância registrada no container (container.js)
//      apontando para a nova classe.
//   Exemplo para Resend: `npm install resend`
//     const { Resend } = require('resend');
//     this.client = new Resend(process.env.RESEND_API_KEY);
//     await this.client.emails.send({ from, to, subject, html });
// ─────────────────────────────────────────────────────────────

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // URL do frontend (não da API) — ex: https://meuapp.com
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  async sendConfirmationEmail({ email, name, token }) {
    const confirmUrl = `${this.frontendUrl}/confirm-email?token=${token}`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Confirme seu e-mail — MedAgenda',
      html: `
        <p>Olá, ${name}!</p>
        <p>Clique no link abaixo para confirmar seu e-mail:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>Este link expira em 1 hora.</p>
      `,
    });
  }

  async sendPasswordResetEmail({ email, name, token }) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Redefinição de senha — MedAgenda',
      html: `
        <p>Olá, ${name}!</p>
        <p>Clique no botão abaixo para redefinir sua senha:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
            Redefinir senha
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;">
          Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.
        </p>
      `,
    });
  }
}

module.exports = EmailService;
