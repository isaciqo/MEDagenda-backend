const nodemailer = require('nodemailer');

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
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  async sendConfirmationEmail({ email, name, token }) {
    const confirmUrl = `${this.appUrl}/api/v1/users/confirm/${token}`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Confirm your email',
      html: `<p>Hi ${name},</p><p>Click <a href="${confirmUrl}">here</a> to confirm your email.</p>`,
    });
  }

  async sendPasswordResetEmail({ email, name, token }) {
    const resetUrl = `${this.appUrl}/api/v1/users/reset-password/${token}`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your password',
      html: `<p>Hi ${name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  }
}

module.exports = EmailService;
