const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

class ListLocationsOperation {
  constructor({ locationRepository, appointmentRepository }) {
    this.locationRepository = locationRepository;
    this.appointmentRepository = appointmentRepository;
  }

  async execute({ doctor_id, search }) {
    if (search) {
      const found = await this.locationRepository.searchByName(doctor_id, search);
      return found.map(this._format);
    }

    let locations = await this.locationRepository.findAll(doctor_id);

    // Migração única: médico que nunca cadastrou um Location, mas já tem
    // endereços digitados em consultas presenciais antigas (o antigo
    // /settings/locations lia isso direto de Appointment.distinct). Grava de
    // verdade (não é um cálculo só-de-leitura) pra dar pra editar/apagar depois
    // — idempotente, só roda quando a lista está genuinamente vazia.
    if (locations.length === 0) {
      const legacyNames = await this.appointmentRepository.findDistinctLocations(doctor_id);
      if (legacyNames.length > 0) {
        const docs = legacyNames.map(name => ({
          location_id: uuidv4(),
          doctor_id,
          name,
          address: '',
          color: null,
        }));
        try {
          await this.locationRepository.createMany(docs);
          logger.info('location.migrate: endereços antigos migrados', { doctor_id, count: docs.length });
        } catch (err) {
          // Melhor esforço — se der conflito de nome duplicado no meio do
          // insertMany (duas consultas com o mesmo endereço em capitalização
          // diferente, por exemplo), segue com o que conseguiu gravar.
          logger.warn('location.migrate: falha parcial na migração', { doctor_id, error: err.message });
        }
        locations = await this.locationRepository.findAll(doctor_id);
      }
    }

    return locations.map(this._format);
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

module.exports = ListLocationsOperation;
