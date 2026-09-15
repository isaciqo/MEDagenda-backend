class GetCancellationSurveyInfoOperation {
  constructor({ cancellationFeedbackRepository }) {
    this.cancellationFeedbackRepository = cancellationFeedbackRepository;
  }

  async execute(feedback_id) {
    const feedback = await this.cancellationFeedbackRepository.findById(feedback_id);
    if (!feedback) {
      const error = new Error('Link inválido');
      error.statusCode = 400;
      throw error;
    }

    return {
      alreadyResponded: !!feedback.respondedAt,
      name: feedback.name,
      plan: feedback.plan,
    };
  }
}

module.exports = GetCancellationSurveyInfoOperation;
