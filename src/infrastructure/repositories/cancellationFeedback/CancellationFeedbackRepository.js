const CancellationFeedback = require('../../../database/models/cancellationFeedback/cancellationFeedbackModel');

class CancellationFeedbackRepository {
  async findById(feedback_id) {
    return CancellationFeedback.findOne({ feedback_id });
  }

  async create(data) {
    const feedback = new CancellationFeedback(data);
    return feedback.save();
  }

  async update(feedback_id, data) {
    return CancellationFeedback.findOneAndUpdate({ feedback_id }, data, { new: true });
  }
}

module.exports = CancellationFeedbackRepository;
