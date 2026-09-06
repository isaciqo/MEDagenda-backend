const Location = require('../../../database/models/location/locationModel');

// name vem direto do usuário e ia sem escapar pra dentro de RegExp/$regex — mesmo
// cuidado de ReDoS já aplicado em PatientRepository.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class LocationRepository {
  // Teto de segurança, mesmo raciocínio de PatientRepository.findAll — nenhum
  // médico real tem mais que uma fração disso.
  async findAll(doctor_id) {
    return Location.find({ doctor_id }).sort({ name: 1 }).limit(2000);
  }

  async findById(location_id) {
    return Location.findOne({ location_id });
  }

  async findByExactName(doctor_id, name) {
    return Location.findOne({ doctor_id, name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') } });
  }

  async searchByName(doctor_id, name) {
    return Location.find({
      doctor_id,
      name: { $regex: escapeRegex(name), $options: 'i' },
    }).sort({ name: 1 }).limit(10);
  }

  async create(data) {
    const location = new Location(data);
    return location.save();
  }

  async createMany(docs) {
    if (docs.length === 0) return [];
    return Location.insertMany(docs, { ordered: false });
  }

  async update(location_id, data) {
    return Location.findOneAndUpdate({ location_id }, data, { new: true });
  }

  async delete(location_id) {
    return Location.findOneAndDelete({ location_id });
  }
}

module.exports = LocationRepository;
