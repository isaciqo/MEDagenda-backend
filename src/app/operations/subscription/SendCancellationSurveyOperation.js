const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

class SendCancellationSurveyOperation {
  constructor({ cancellationFeedbackRepository, emailService }) {
    this.cancellationFeedbackRepository = cancellationFeedbackRepository;
    this.emailService = emailService;
  }

  // Chamado pelo webhook de customer.subscription.deleted. Melhor esforço:
  // se o e-mail falhar, o cancelamento em si (já processado pelo webhook) não
  // pode ser derrubado por isso — só loga.
  async execute({ doctor_id, name, email, plan }) {
    const feedback_id = uuidv4();
    const frontendUrl = this.emailService.frontendUrl;
    const surveyUrl = `${frontendUrl}/cancelamento/${feedback_id}`;

    await this.cancellationFeedbackRepository.create({
      feedback_id,
      doctor_id,
      name,
      email,
      plan,
      canceledAt: new Date(),
    });

    try {
      await this.emailService.sendCancellationSurveyEmail({ email, name, surveyUrl });
      await this.cancellationFeedbackRepository.update(feedback_id, { emailSentAt: new Date() });
    } catch (err) {
      logger.warn('cancellation.survey: falha ao enviar e-mail de pesquisa', { doctor_id, error: err.message });
    }
  }
}

module.exports = SendCancellationSurveyOperation;
