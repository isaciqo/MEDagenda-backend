class LocationController {
  constructor({ createLocationOperation, listLocationsOperation, updateLocationOperation, deleteLocationOperation }) {
    this.createLocationOperation = createLocationOperation;
    this.listLocationsOperation = listLocationsOperation;
    this.updateLocationOperation = updateLocationOperation;
    this.deleteLocationOperation = deleteLocationOperation;
  }

  async create(req, res) {
    const result = await this.createLocationOperation.execute({
      doctor_id: req.user.user_id,
      ...req.body,
    });
    res.status(201).json(result);
  }

  async list(req, res) {
    const result = await this.listLocationsOperation.execute({
      doctor_id: req.user.user_id,
      search: req.query.search,
    });
    res.status(200).json(result);
  }

  async update(req, res) {
    const result = await this.updateLocationOperation.execute(
      req.params.location_id,
      req.body,
      req.user.user_id,
    );
    res.status(200).json(result);
  }

  async delete(req, res) {
    const result = await this.deleteLocationOperation.execute(
      req.params.location_id,
      req.user.user_id,
    );
    res.status(200).json(result);
  }
}

module.exports = LocationController;
