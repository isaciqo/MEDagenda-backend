const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

class CreateLocationOperation {
  constructor({ locationRepository }) {
    this.locationRepository = locationRepository;
  }

  async execute({ doctor_id, name, address, color, defaultShiftDurationMinutes }) {
    const existing = await this.locationRepository.findByExactName(doctor_id, name);
    if (existing) {
      logger.warn('location.create: nome já cadastrado', { doctor_id, name });
      const error = new Error('Já existe um local com esse nome');
      error.statusCode = 409;
      throw error;
    }

    const location = await this.locationRepository.create({
      location_id: uuidv4(),
      doctor_id,
      name,
      address: address || '',
      color: color || null,
      defaultShiftDurationMinutes: defaultShiftDurationMinutes ?? null,
    });

    logger.info('location.create: local criado', { doctor_id, location_id: location.location_id, name });
    return this._format(location);
  }

  _format(l) {
    return {
      id: l.location_id,
      name: l.name,
      address: l.address || '',
      color: l.color || null,
      defaultShiftDurationMinutes: l.defaultShiftDurationMinutes ?? null,
    };
  }
}

module.exports = CreateLocationOperation;
