class SupportController {
  constructor({ sendSupportEmailOperation }) {
    this.sendSupportEmailOperation = sendSupportEmailOperation;
  }

  async send(req, res) {
    const doctor_id = req.user.user_id;
    const { tipoSolicitacao, assunto, mensagem, currentUrl } = req.body;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.sendSupportEmailOperation.execute(doctor_id, {
      tipoSolicitacao,
      assunto,
      mensagem,
      currentUrl,
      userAgent,
    });

    res.status(200).json(result);
  }
}

module.exports = SupportController;
