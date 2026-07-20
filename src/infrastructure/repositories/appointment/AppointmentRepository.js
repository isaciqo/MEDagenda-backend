const Appointment = require('../../../database/models/appointment/appointmentModel');

class AppointmentRepository {
  async findById(appointment_id) {
    return Appointment.findOne({ appointment_id });
  }

  async findAll({ doctor_id, date, status, from, to }) {
    const filter = { doctor_id };
    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
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

  async findByConfirmToken(token) {
    return Appointment.findOne({
      confirmToken: token,
      confirmTokenExpires: { $gt: new Date() },
    });
  }

  async delete(appointment_id) {
    return Appointment.findOneAndDelete({ appointment_id });
  }

  async findByDoctorAndDateRange(doctor_id, from, to) {
    const filter = { doctor_id };
    if (from) filter.date = { ...filter.date, $gte: from };
    if (to) filter.date = { ...filter.date, $lte: to };
    return Appointment.find(filter).sort({ date: 1, time: 1 });
  }

  async findByPatientId(patient_id) {
    return Appointment.find({ 'patient.id': patient_id });
  }

  async deleteByPatientId(patient_id) {
    return Appointment.deleteMany({ 'patient.id': patient_id });
  }

  async cancelReturnAppointments(appointment_id) {
    return Appointment.updateMany(
      { returnOf: appointment_id, status: { $ne: 'cancelado' } },
      { $set: { status: 'cancelado' } }
    );
  }

  async deleteByReturnOf(appointment_id) {
    return Appointment.deleteMany({ returnOf: appointment_id });
  }

  async findByDoctorDateTime(doctor_id, date, time) {
    return Appointment.findOne({ doctor_id, date, time, status: { $ne: 'cancelado' } });
  }

  async countByDoctorAndMonth(doctor_id, year, month) {
    const pad = String(month).padStart(2, '0');
    const from = `${year}-${pad}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${pad}-${String(lastDay).padStart(2, '0')}`;
    return Appointment.countDocuments({
      doctor_id,
      date: { $gte: from, $lte: to },
      status: { $ne: 'cancelado' },
    });
  }
}

module.exports = AppointmentRepository;
