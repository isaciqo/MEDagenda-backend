const Patient = require('../../../database/models/patient/patientModel');

class PatientRepository {
  async findAll(doctor_id) {
    return Patient.find({ doctor_id }).sort({ name: 1 });
  }

  async findById(patient_id) {
    return Patient.findOne({ patient_id });
  }

  async findByPhone(doctor_id, phone) {
    return Patient.findOne({ doctor_id, phone });
  }

  async searchByName(doctor_id, name) {
    return Patient.find({
      doctor_id,
      name: { $regex: name, $options: 'i' },
    }).sort({ name: 1 }).limit(10);
  }

  async countByName(doctor_id, name) {
    return Patient.countDocuments({ doctor_id, name });
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
