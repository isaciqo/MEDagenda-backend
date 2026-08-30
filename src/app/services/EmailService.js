const { Resend } = require('resend');
const logger = require('../../lib/logger');

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    // Lembre-se de usar o domínio validado no Resend (ex: 'CliniQ <noreply@cliniqbrasil.com>')
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS || 'noreply@cliniqbrasil.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'CliniQ Brasil';
  }

  /**
   * Método privado centralizado para disparar e-mails via Resend
   */
  async _send({ from, to, subject, html, replyTo }, context) {
    try {
      const senderAddress = from || `${this.fromName} <${this.fromEmail}>`;

      const payload = {
        from: senderAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      };

      if (replyTo) {
        payload.reply_to = replyTo;
      }

      const { data, error } = await this.resend.emails.send(payload);

      if (error) {
        logger.error(`email.send: falha ao enviar ${context}`, {
          message: error.message,
          name: error.name,
        });
        throw new Error(`Resend Error: ${error.message}`);
      }

      logger.info(`email.send: ${context} enviado com sucesso`, { id: data?.id });
      return data;
    } catch (err) {
      logger.error(`email.send: exceção ao enviar ${context}`, {
        message: err.message,
      });
      throw err;
    }
  }

  /**
   * Casca visual compartilhada por todo e-mail do CliniQ — cabeçalho azul com a marca,
   * card branco arredondado, rodapé padrão. Todo método de envio monta só o miolo
   * (bodyHtml) e passa por aqui, pra manter os e-mails visualmente consistentes sem
   * duplicar a mesma centena de linhas de HTML em cada um.
   */
  _layout({ eyebrow, title, bodyHtml, footerHtml }) {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f0f3fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f3fa;padding:40px 20px;">
          <tr><td align="center">
            <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#628ECB,#395886);padding:28px 40px;">
                  <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">CliniQ Brasil</p>
                  ${eyebrow ? `<p style="margin:4px 0 0;font-size:13px;color:#d5deef;">${eyebrow}</p>` : ''}
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  ${title ? `<p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#16233d;">${title}</p>` : ''}
                  ${bodyHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px;border-top:1px solid #f0f3fa;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9aa8bf;">
                    ${footerHtml || `Você está recebendo este e-mail porque possui uma conta no CliniQ Brasil.<br><a href="${this.frontendUrl}" style="color:#628ECB;">Acessar o CliniQ Brasil</a>`}
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;
  }

  // Rota de lead de clínica é pública (sem login) — diferente do resto dos
  // e-mails, o texto que cai aqui dentro nunca passou por um usuário
  // autenticado antes. Escapa antes de interpolar no HTML do e-mail pra
  // fechar a superfície de HTML injection que um formulário público abre.
  _escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _ctaButton(url, label) {
    return `
      <div style="text-align:center;margin:12px 0 4px;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;background:#395886;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:-0.2px;">
          ${label}
        </a>
      </div>
    `;
  }

  _securityWarning(text) {
    return `
      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px 20px;margin-top:20px;">
        <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.5;">⚠️ ${text}</p>
      </div>
    `;
  }

  async sendConfirmationEmail({ email, name, token }) {
    const confirmUrl = `${this.frontendUrl}/confirm-email?token=${token}`;

    return this._send(
      {
        to: email,
        subject: 'Confirme seu e-mail - CliniQ Brasil',
        html: this._layout({
          eyebrow: 'Confirmação de cadastro',
          title: `Olá, ${name}!`,
          bodyHtml: `
            <p style="margin:0 0 20px;font-size:15px;color:#4b5f7e;line-height:1.6;">
              Falta só um passo pra ativar sua conta no CliniQ Brasil. Clique no botão abaixo pra confirmar seu e-mail:
            </p>
            ${this._ctaButton(confirmUrl, 'Confirmar meu e-mail')}
            <p style="margin:20px 0 0;font-size:13px;color:#9aa8bf;text-align:center;">Este link expira em 1 hora.</p>
          `,
        }),
      },
      `confirmação para ${email}`
    );
  }

  async sendTrialExpiryWarning({ email, name, daysLeft, upgradeUrl }) {
    return this._send(
      {
        to: email,
        subject: `CliniQ: seu período de teste termina em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`,
        html: this._layout({
          eyebrow: 'Seu plano',
          title: `Olá, ${name}!`,
          bodyHtml: `
            <p style="margin:0 0 20px;font-size:15px;color:#4b5f7e;line-height:1.6;">
              Seu período de teste gratuito do CliniQ Brasil termina em
              <strong style="color:#16233d;">${daysLeft} dia${daysLeft !== 1 ? 's' : ''}</strong>.
              Não perca o acesso à sua agenda e aos seus dados.
            </p>

            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                ⚠️ Após o término do teste, sua conta entrará em modo expirado e você não conseguirá criar novas consultas.
              </p>
            </div>

            <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#4b5f7e;text-transform:uppercase;letter-spacing:0.05em;">
              Escolha um plano
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td style="width:48%;border:1px solid #d5deef;border-radius:8px;padding:16px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#16233d;">Essencial</p>
                  <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#395886;">R$34,90<span style="font-size:12px;font-weight:400;color:#9aa8bf;">/mês</span></p>
                  <p style="margin:0;font-size:12px;color:#9aa8bf;">Até 80 consultas/mês</p>
                </td>
                <td style="width:4%;"></td>
                <td style="width:48%;border:2px solid #395886;border-radius:8px;padding:16px;vertical-align:top;background:#f0f3fa;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#395886;text-transform:uppercase;">Mais popular</p>
                  <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#16233d;">Profissional</p>
                  <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#395886;">R$49,90<span style="font-size:12px;font-weight:400;color:#9aa8bf;">/mês</span></p>
                  <p style="margin:0;font-size:12px;color:#9aa8bf;">Consultas ilimitadas + WhatsApp</p>
                </td>
              </tr>
            </table>
            ${this._ctaButton(upgradeUrl, 'Fazer upgrade agora')}
          `,
        }),
      },
      `aviso de trial expirando para ${email}`
    );
  }

  async sendPlanExpiryWarning({ email, name, daysLeft, expiryDate, planName, renewUrl }) {
    return this._send(
      {
        to: email,
        subject: `Seu acesso ao CliniQ termina em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`,
        html: this._layout({
          eyebrow: 'Assinatura cancelada',
          title: `Olá, ${name}!`,
          bodyHtml: `
            <p style="margin:0 0 20px;font-size:15px;color:#4b5f7e;line-height:1.6;">
              Sua assinatura do plano <strong style="color:#16233d;">${planName}</strong> foi cancelada e seu
              acesso ao CliniQ Brasil termina em
              <strong style="color:#16233d;">${daysLeft} dia${daysLeft !== 1 ? 's' : ''}</strong>,
              no dia ${expiryDate}.
            </p>

            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                ⚠️ Depois dessa data você não vai conseguir mais acessar sua agenda, clientes e histórico de consultas.
              </p>
            </div>

            <p style="margin:0 0 16px;font-size:15px;color:#4b5f7e;line-height:1.6;">
              Para continuar usando sem interrupção, reative sua assinatura:
            </p>
            ${this._ctaButton(renewUrl, 'Reativar assinatura')}
          `,
        }),
      },
      `aviso de plano expirando para ${email}`
    );
  }

  // trialDays vem calculado de trialExpiresAt (ver EmailConfirmationOperation)
  // porque não é sempre o mesmo número: quem chega por indicação válida ganha
  // mais tempo de trial (TRIAL_REFERRED_DAYS, ver src/lib/trialPeriod.js).
  async sendWelcomeEmail({ email, name, trialDays }) {
    const loginUrl = `${this.frontendUrl}/login`;

    return this._send(
      {
        to: email,
        subject: `Boas-vindas ao CliniQ Brasil! Seu trial de ${trialDays} dias começou.`,
        html: this._layout({
          eyebrow: 'Conta confirmada',
          title: `Bem-vindo(a), ${name}!`,
          bodyHtml: `
            <p style="margin:0 0 12px;font-size:15px;color:#4b5f7e;line-height:1.6;">
              Sua conta foi confirmada com sucesso. Seu período de teste gratuito de ${trialDays} dias está ativo!
            </p>
            <p style="margin:0 0 20px;font-size:15px;color:#4b5f7e;line-height:1.6;">
              Organize sua agenda, cadastre clientes e experimente todas as funcionalidades sem custo.
            </p>
            ${this._ctaButton(loginUrl, 'Acessar o CliniQ Brasil')}
            <p style="margin:20px 0 0;font-size:13px;color:#9aa8bf;text-align:center;">Em caso de dúvidas, responda este e-mail.</p>
          `,
        }),
      },
      `boas-vindas para ${email}`
    );
  }

  async sendSupportEmail({
    ticketId,
    replyTo,
    userName,
    userEmail,
    userId,
    userPlan,
    tipoSolicitacao,
    assunto,
    mensagem,
    currentUrl,
    userAgent,
    timestamp,
  }) {
    const supportEmail = process.env.SUPPORT_EMAIL || this.fromEmail;

    return this._send(
      {
        to: supportEmail,
        replyTo: `${userName} <${replyTo}>`,
        subject: `[${ticketId}] [${tipoSolicitacao}] ${assunto}`,
        html: this._layout({
          eyebrow: `${tipoSolicitacao} · Chamado ${ticketId}`,
          title: 'Suporte',
          bodyHtml: `
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#4b5f7e;text-transform:uppercase;letter-spacing:0.05em;">Assunto</p>
            <p style="margin:0 0 24px;font-size:16px;font-weight:600;color:#16233d;">${assunto}</p>

            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#4b5f7e;text-transform:uppercase;letter-spacing:0.05em;">Mensagem</p>
            <div style="background:#f0f3fa;border:1px solid #d5deef;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:14px;color:#16233d;line-height:1.7;white-space:pre-wrap;">${mensagem}</p>
            </div>

            <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#4b5f7e;text-transform:uppercase;letter-spacing:0.05em;">Contexto do usuário</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d5deef;border-radius:8px;overflow:hidden;font-size:12px;">
              <tr style="background:#f0f3fa;">
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;width:100px;">Nome</td>
                <td style="padding:10px 16px;color:#16233d;">${userName}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;border-top:1px solid #f0f3fa;">E-mail</td>
                <td style="padding:10px 16px;color:#16233d;border-top:1px solid #f0f3fa;">${userEmail}</td>
              </tr>
              <tr style="background:#f0f3fa;">
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;border-top:1px solid #f0f3fa;">User ID</td>
                <td style="padding:10px 16px;color:#16233d;border-top:1px solid #f0f3fa;font-family:monospace;">${userId}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;border-top:1px solid #f0f3fa;">Plano</td>
                <td style="padding:10px 16px;color:#16233d;border-top:1px solid #f0f3fa;">${userPlan}</td>
              </tr>
              <tr style="background:#f0f3fa;">
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;border-top:1px solid #f0f3fa;">URL</td>
                <td style="padding:10px 16px;color:#16233d;border-top:1px solid #f0f3fa;word-break:break-all;">${currentUrl}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;border-top:1px solid #f0f3fa;">Data</td>
                <td style="padding:10px 16px;color:#16233d;border-top:1px solid #f0f3fa;">${timestamp}</td>
              </tr>
              <tr style="background:#f0f3fa;">
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;border-top:1px solid #f0f3fa;vertical-align:top;">User-Agent</td>
                <td style="padding:10px 16px;color:#16233d;border-top:1px solid #f0f3fa;word-break:break-all;">${userAgent}</td>
              </tr>
            </table>
          `,
          footerHtml: 'Responda este e-mail para contatar o usuário diretamente.',
        }),
      },
      `suporte de ${userEmail}`
    );
  }

  async sendSupportConfirmationEmail({ ticketId, email, name, tipoSolicitacao, assunto, mensagem }) {
    return this._send(
      {
        to: email,
        subject: `[${ticketId}] Recebemos sua solicitação: ${assunto}`,
        html: this._layout({
          eyebrow: `Chamado ${ticketId}`,
          title: `Olá, ${name}!`,
          bodyHtml: `
            <p style="margin:0 0 16px;font-size:15px;color:#4b5f7e;line-height:1.6;">
              Recebemos sua solicitação de suporte (${tipoSolicitacao}) e vamos responder o quanto antes.
            </p>
            <p style="margin:0 0 20px;font-size:13px;color:#9aa8bf;">
              Número do chamado: <strong style="color:#16233d;font-family:monospace;">${ticketId}</strong>. Guarde essa referência.
            </p>
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#4b5f7e;text-transform:uppercase;letter-spacing:0.05em;">Assunto</p>
            <p style="margin:0 0 16px;font-size:14px;color:#16233d;">${assunto}</p>
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#4b5f7e;text-transform:uppercase;letter-spacing:0.05em;">Sua mensagem</p>
            <div style="background:#f0f3fa;border:1px solid #d5deef;border-radius:8px;padding:16px 20px;">
              <p style="margin:0;font-size:14px;color:#16233d;white-space:pre-wrap;line-height:1.7;">${mensagem}</p>
            </div>
            <p style="margin:20px 0 0;font-size:13px;color:#9aa8bf;">Se quiser complementar, é só responder este e-mail.</p>
          `,
        }),
      },
      `confirmação de suporte para ${email}`
    );
  }

  async sendClinicLeadEmail({ leadId, name, email, clinicName, professionalsCount, message }) {
    const supportEmail = process.env.SUPPORT_EMAIL || this.fromEmail;
    const safeName = this._escapeHtml(name);
    const safeClinic = this._escapeHtml(clinicName || 'Não informado');
    const safeCount = this._escapeHtml(professionalsCount || 'Não informado');
    const safeMessage = this._escapeHtml(message);

    return this._send(
      {
        to: supportEmail,
        replyTo: `${safeName} <${email}>`,
        subject: `[Lead clínica] ${safeClinic !== 'Não informado' ? safeClinic : safeName}`,
        html: this._layout({
          eyebrow: `Lead de clínica · ${leadId}`,
          title: 'Alguém quer algo sob medida pra clínica',
          bodyHtml: `
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#4b5f7e;text-transform:uppercase;letter-spacing:0.05em;">Mensagem</p>
            <div style="background:#f0f3fa;border:1px solid #d5deef;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#16233d;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d5deef;border-radius:8px;overflow:hidden;font-size:12px;">
              <tr style="background:#f0f3fa;">
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;width:120px;">Nome</td>
                <td style="padding:10px 16px;color:#16233d;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;border-top:1px solid #f0f3fa;">E-mail</td>
                <td style="padding:10px 16px;color:#16233d;border-top:1px solid #f0f3fa;">${this._escapeHtml(email)}</td>
              </tr>
              <tr style="background:#f0f3fa;">
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;border-top:1px solid #f0f3fa;">Clínica</td>
                <td style="padding:10px 16px;color:#16233d;border-top:1px solid #f0f3fa;">${safeClinic}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-weight:600;color:#4b5f7e;border-top:1px solid #f0f3fa;">Profissionais</td>
                <td style="padding:10px 16px;color:#16233d;border-top:1px solid #f0f3fa;">${safeCount}</td>
              </tr>
            </table>
          `,
          footerHtml: 'Responda este e-mail para falar diretamente com a pessoa.',
        }),
      },
      `lead de clínica de ${email}`
    );
  }

  async sendPasswordResetEmail({ email, name, token }) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    return this._send(
      {
        to: email,
        subject: 'Redefinição de senha - CliniQ Brasil',
        html: this._layout({
          eyebrow: 'Segurança da conta',
          title: `Olá, ${name}!`,
          bodyHtml: `
            <p style="margin:0 0 20px;font-size:15px;color:#4b5f7e;line-height:1.6;">
              Clique no botão abaixo para redefinir sua senha:
            </p>
            ${this._ctaButton(resetUrl, 'Redefinir senha')}
            <p style="margin:20px 0 0;font-size:13px;color:#9aa8bf;text-align:center;">
              Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.
            </p>
          `,
        }),
      },
      `reset de senha para ${email}`
    );
  }

  async sendPasswordChangedNotice({ email, name }) {
    return this._send(
      {
        to: email,
        subject: 'Sua senha foi alterada - CliniQ Brasil',
        html: this._layout({
          eyebrow: 'Segurança da conta',
          title: `Olá, ${name}!`,
          bodyHtml: `
            <p style="margin:0;font-size:15px;color:#4b5f7e;line-height:1.6;">Sua senha foi alterada com sucesso.</p>
            ${this._securityWarning('Se não foi você quem fez essa alteração, contate o suporte imediatamente.')}
          `,
        }),
      },
      `aviso de senha alterada para ${email}`
    );
  }

  async sendEmailChangeConfirmation({ email, name, token }) {
    const confirmUrl = `${this.frontendUrl}/confirmar-troca-email?token=${token}`;

    return this._send(
      {
        to: email,
        subject: 'Confirme seu novo e-mail - CliniQ Brasil',
        html: this._layout({
          eyebrow: 'Segurança da conta',
          title: `Olá, ${name}!`,
          bodyHtml: `
            <p style="margin:0 0 20px;font-size:15px;color:#4b5f7e;line-height:1.6;">
              Recebemos um pedido para usar este e-mail na sua conta CliniQ Brasil. Clique no botão abaixo para confirmar:
            </p>
            ${this._ctaButton(confirmUrl, 'Confirmar novo e-mail')}
            <p style="margin:20px 0 0;font-size:13px;color:#9aa8bf;text-align:center;">
              Este link expira em 1 hora. Se você não solicitou essa troca, ignore este e-mail.
            </p>
          `,
        }),
      },
      `confirmação de troca de e-mail para ${email}`
    );
  }

  async sendEmailChangedNotice({ email, name, newEmail }) {
    return this._send(
      {
        to: email,
        subject: 'O e-mail da sua conta foi alterado - CliniQ Brasil',
        html: this._layout({
          eyebrow: 'Segurança da conta',
          title: `Olá, ${name}!`,
          bodyHtml: `
            <p style="margin:0;font-size:15px;color:#4b5f7e;line-height:1.6;">
              O e-mail da sua conta CliniQ Brasil foi alterado para <strong style="color:#16233d;">${newEmail}</strong>.
            </p>
            ${this._securityWarning('Se não foi você quem fez essa alteração, contate o suporte imediatamente.')}
          `,
        }),
      },
      `aviso de e-mail alterado para ${email}`
    );
  }
}

module.exports = EmailService;
