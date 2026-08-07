class GetSavedLocationsOperation {
  constructor({ appointmentRepository }) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(doctor_id) {
    return this.appointmentRepository.findDistinctLocations(doctor_id);
  }
}

module.exports = GetSavedLocationsOperation;
