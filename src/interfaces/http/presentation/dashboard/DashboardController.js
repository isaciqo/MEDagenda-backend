class DashboardController {
  constructor({ getDashboardStatsOperation }) {
    this.getDashboardStatsOperation = getDashboardStatsOperation;
  }

  async stats(req, res) {
    const result = await this.getDashboardStatsOperation.execute(req.user.user_id);
    res.status(200).json(result);
  }
}

module.exports = DashboardController;
