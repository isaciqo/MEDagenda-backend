class DashboardController {
  constructor({ getDashboardStatsOperation }) {
    this.getDashboardStatsOperation = getDashboardStatsOperation;
  }

  async stats(req, res) {
    const { view, month, year } = req.query;
    const result = await this.getDashboardStatsOperation.execute(req.user.user_id, { view, month, year });
    res.status(200).json(result);
  }
}

module.exports = DashboardController;
