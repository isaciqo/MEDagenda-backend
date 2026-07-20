class SendSupportEmailOperation {
  constructor({ emailService, userRepository }) {
    this.emailService = emailService;
    this.userRepository = userRepository;
  }

  async execute(doctor_id, { tipoSolicitacao, assunto, mensagem, currentUrl, userAgent }) {
    const user = await this.userRepository.findById(doctor_id);

    await this.emailService.sendSupportEmail({
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

    return { ok: true };
  }
}

module.exports = SendSupportEmailOperation;
