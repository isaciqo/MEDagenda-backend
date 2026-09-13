const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

class ListLocationsOperation {
  constructor({ locationRepository, appointmentRepository, userRepository }) {
    this.locationRepository = locationRepository;
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
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
    // verdade (não é um cálculo só-de-leitura) pra dar pra editar/apagar depois.
    // Precisa checar `locationsMigrated` (flag persistente), não só "a lista
    // está vazia agora" — senão, apagar todos os Locais depois da primeira
    // migração faz endereços antigos (às vezes só teste) ressuscitarem sozinhos
    // a cada vez que a lista zera de novo.
    const user = await this.userRepository.findById(doctor_id);
    if (locations.length === 0 && user && !user.locationsMigrated) {
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
      // Marca como migrado mesmo sem endereço legado nenhum — senão essa
      // checagem roda de novo em toda chamada futura enquanto a lista seguir
      // vazia.
      await this.userRepository.update(doctor_id, { locationsMigrated: true });
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
      defaultShiftValue: l.defaultShiftValue ?? null,
    };
  }
}

module.exports = ListLocationsOperation;
