const { v4: uuidv4 } = require('uuid');
const SupportTicket = require('../../../database/models/SupportTicket');
const logger = require('../../../lib/logger');

class SendSupportEmailOperation {
  constructor({ emailService, userRepository }) {
    this.emailService = emailService;
    this.userRepository = userRepository;
  }

  async execute(doctor_id, { tipoSolicitacao, assunto, mensagem, currentUrl, userAgent }) {
    const user = await this.userRepository.findById(doctor_id);
    const ticketId = `CLQ-${uuidv4().split('-')[0].toUpperCase()}`;

    await SupportTicket.create({
      ticketId,
      doctor_id,
      userEmail: user.email,
      userName: user.name,
      tipoSolicitacao,
      assunto,
      mensagem,
      currentUrl: currentUrl || '',
      userAgent: userAgent || '',
    });

    await this.emailService.sendSupportEmail({
      ticketId,
      replyTo: user.email,
      userName: user.name,
      userEmail: user.email,
      userId: doctor_id,
      userPlan: user.plan || 'trial',
      tipoSolicitacao,
      assunto,
      mensagem,
      currentUrl: currentUrl || '',
      userAgent: userAgent || '',
      timestamp: new Date().toISOString(),
    });

    // Best-effort: o chamado já foi salvo e chegou no suporte nesse ponto — uma falha
    // aqui não pode fazer a requisição do médico parecer que deu errado.
    try {
      await this.emailService.sendSupportConfirmationEmail({
        ticketId,
        email: user.email,
        name: user.name,
        tipoSolicitacao,
        assunto,
        mensagem,
      });
    } catch (err) {
      logger.error('support.send: falha ao enviar confirmação pro usuário', {
        doctor_id,
        ticketId,
        error: err.message,
      });
    }

    return { ok: true, ticketId };
  }
}

module.exports = SendSupportEmailOperation;
