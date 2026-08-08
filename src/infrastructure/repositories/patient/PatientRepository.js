const Patient = require('../../../database/models/patient/patientModel');

// name vem direto do usuário (nome do paciente digitado no formulário) e ia sem
// escapar pra dentro de RegExp/$regex — um nome tipo "(a+)+$" causava catastrophic
// backtracking na query (ReDoS). Escapa os metacaracteres antes de montar o padrão.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class PatientRepository {
  // Teto de segurança — nunca existiu limite aqui. Nenhum médico real tem mais que
  // uma fração disso, então não afeta uso legítimo; impede que a lista cresça sem
  // limite numa única resposta (ver ANALISE_ABUSO_CUSTO.md).
  async findAll(doctor_id) {
    return Patient.find({ doctor_id }).sort({ name: 1 }).limit(2000);
  }

  async findById(patient_id) {
    return Patient.findOne({ patient_id });
  }

  async findByPhone(doctor_id, phone) {
    return Patient.findOne({ doctor_id, phone });
  }

  async findByExactName(doctor_id, name) {
    return Patient.findOne({ doctor_id, name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') } });
  }

  async searchByName(doctor_id, name) {
    return Patient.find({
      doctor_id,
      name: { $regex: escapeRegex(name), $options: 'i' },
    }).sort({ name: 1 }).limit(10);
  }

  async countByName(doctor_id, name) {
    return Patient.countDocuments({ doctor_id, name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } });
  }

  async create(data) {
    const patient = new Patient(data);
    return patient.save();
  }

  async update(patient_id, data) {
    return Patient.findOneAndUpdate({ patient_id }, data, { new: true });
  }

  async delete(patient_id) {
    return Patient.findOneAndDelete({ patient_id });
  }
}

module.exports = PatientRepository;
