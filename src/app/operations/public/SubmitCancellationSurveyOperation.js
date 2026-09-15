class SubmitCancellationSurveyOperation {
  constructor({ cancellationFeedbackRepository }) {
    this.cancellationFeedbackRepository = cancellationFeedbackRepository;
  }

  async execute(feedback_id, { reasonCategory, comment }) {
    const feedback = await this.cancellationFeedbackRepository.findById(feedback_id);
    if (!feedback) {
      const error = new Error('Link inválido');
      error.statusCode = 400;
      throw error;
    }

    // Garante que o link só pode ser respondido uma vez (mesma ideia do
    // review por link).
    if (feedback.respondedAt) {
      const error = new Error('Você já respondeu essa pesquisa');
      error.statusCode = 409;
      throw error;
    }

    const updated = await this.cancellationFeedbackRepository.update(feedback_id, {
      reasonCategory,
      comment: comment || '',
      respondedAt: new Date(),
    });

    return {
      reasonCategory: updated.reasonCategory,
      comment: updated.comment,
    };
  }
}

module.exports = SubmitCancellationSurveyOperation;
