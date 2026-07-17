const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  start: { type: String, default: '08:00' },
  end: { type: String, default: '18:00' },
  enabled: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isConfirmed: { type: Boolean, default: false },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  specialty: { type: String, default: '' },
  clinicAddress: { type: String, default: '' },
  photoUrl: { type: String, default: null },
  whatsappTemplate: { type: String, default: 'Olá {nome}, confirmando sua consulta em {data} às {hora} com {medico}. Confirma sua presenca? {link}' },
  defaultDuration: { type: Number, default: 30 },
  tokenVersion: { type: Number, default: 0 },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  plan: { type: String, enum: ['trial', 'essencial', 'profissional'], default: 'trial' },
  trialExpiresAt: { type: Date, default: null },
  planExpiresAt: { type: Date, default: null },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  googleId: { type: String, default: null, sparse: true },
  trialWarningSentAt: { type: Date, default: null },
  schedule: {
    type: Map,
    of: scheduleSchema,
    default: {
      segunda: { start: '08:00', end: '18:00', enabled: true },
      terca: { start: '08:00', end: '18:00', enabled: true },
      quarta: { start: '08:00', end: '18:00', enabled: true },
      quinta: { start: '08:00', end: '18:00', enabled: true },
      sexta: { start: '08:00', end: '18:00', enabled: true },
      sabado: { start: '08:00', end: '12:00', enabled: false },
      domingo: { start: '08:00', end: '12:00', enabled: false },
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
