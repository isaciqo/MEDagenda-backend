const Appointment = require('../../../database/models/appointment/appointmentModel');

class AppointmentRepository {
  async findById(appointment_id) {
    return Appointment.findOne({ appointment_id });
  }

  async findAll({ doctor_id, date, status }) {
    const filter = { doctor_id };
    if (date) filter.date = date;
    if (status) filter.status = status;
    return Appointment.find(filter).sort({ date: 1, time: 1 });
  }

  async create(data) {
    const appointment = new Appointment(data);
    return appointment.save();
  }

  async update(appointment_id, data) {
    return Appointment.findOneAndUpdate({ appointment_id }, data, { new: true });
  }

  async findByReviewLinkId(reviewLinkId) {
    return Appointment.findOne({ activeReviewLinkId: reviewLinkId });
  }

  async findByDoctorAndDateRange(doctor_id, from, to) {
    const filter = { doctor_id };
    if (from) filter.date = { ...filter.date, $gte: from };
    if (to) filter.date = { ...filter.date, $lte: to };
    return Appointment.find(filter).sort({ date: 1, time: 1 });
  }
}

module.exports = AppointmentRepository;
