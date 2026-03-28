class ReviewController {
  constructor({ listReviewsOperation, createReviewOperation }) {
    this.listReviewsOperation = listReviewsOperation;
    this.createReviewOperation = createReviewOperation;
  }

  async list(req, res) {
    const result = await this.listReviewsOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }

  async create(req, res) {
    const result = await this.createReviewOperation.execute(req.body);
    res.status(201).json(result);
  }
}

module.exports = ReviewController;
