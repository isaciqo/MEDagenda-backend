class UpdateLocationOperation {
  constructor({ locationRepository }) {
    this.locationRepository = locationRepository;
  }

  async execute(location_id, { name, address, color, defaultShiftDurationMinutes }, doctor_id) {
    const existing = await this.locationRepository.findById(location_id);
    if (!existing) {
      const error = new Error('Local não encontrado');
      error.statusCode = 404;
      throw error;
    }
    if (existing.doctor_id !== doctor_id) {
      const error = new Error('Acesso negado');
      error.statusCode = 403;
      throw error;
    }

    if (name && name !== existing.name) {
      const byName = await this.locationRepository.findByExactName(doctor_id, name);
      if (byName && byName.location_id !== location_id) {
        const error = new Error('Já existe um local com esse nome');
        error.statusCode = 409;
        throw error;
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (color !== undefined) updateData.color = color;
    if (defaultShiftDurationMinutes !== undefined) updateData.defaultShiftDurationMinutes = defaultShiftDurationMinutes;

    const updated = await this.locationRepository.update(location_id, updateData);

    return {
      id: updated.location_id,
      name: updated.name,
      address: updated.address || '',
      color: updated.color || null,
      defaultShiftDurationMinutes: updated.defaultShiftDurationMinutes ?? null,
    };
  }
}

module.exports = UpdateLocationOperation;
