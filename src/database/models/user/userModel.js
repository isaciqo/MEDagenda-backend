const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  start: { type: String, default: '08:00' },
  end: { type: String, default: '18:00' },
  enabled: { type: Boolean, default: false },
}, { _id: false });

const paymentMethodSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  percentage: { type: Number, default: 0 },
  fixed: { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isConfirmed: { type: Boolean, default: false },
  // Registro de consentimento (LGPD): quando a conta foi criada, precisa ter
  // aceitado a Política de Privacidade. Null só acontece em conta legada,
  // criada antes desse campo existir.
  termsAcceptedAt: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  pendingEmail: { type: String, default: null },
  pendingEmailRequestedAt: { type: Date, default: null },
  specialty: { type: String, default: '' },
  clinicAddress: { type: String, default: '' },
  photoUrl: { type: String, default: null },
  whatsappTemplate: { type: String, default: 'Olá {cliente}, confirmando sua consulta em {data} às {hora} com {profissional}. Confirma sua presenca? {link}' },
  reviewTemplate: { type: String, default: 'Olá {cliente}, obrigado pela sua consulta! Deixe sua avaliação:\n\n{link}' },
  returnTemplate: { type: String, default: 'Olá {cliente}! {profissional} recomenda que você agende um retorno em {dias}. Entre em contato para marcar sua consulta de retorno.' },
  meetingLinkTemplate: { type: String, default: 'Olá {cliente}! Segue o link da nossa consulta online:\n{link_reuniao}' },
  rescheduleAcceptedTemplate: { type: String, default: 'Olá {cliente}! Sua consulta com {profissional} foi remarcada para {data} às {hora}. Até lá!' },
  defaultDuration: { type: Number, default: 30 },
  defaultConsultationValue: { type: Number, default: 0 },
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
  planWarningSentAt: { type: Date, default: null },
  onboardingCompleted: { type: Boolean, default: false },
  referralCode: { type: String, default: null, sparse: true },
  referralRewardGrantedAt: { type: Date, default: null },
  pendingReferralCode: { type: String, default: null },
  followUpMode: { type: String, enum: ['paid_recurrence', 'return', 'free'], default: null },
  allowPatientReschedule: { type: Boolean, default: true },
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
  // Lista editável pelo médico (adicionar/renomear/remover formas de
  // pagamento). Sem `default` de propósito: se tivesse, o Mongoose aplicaria
  // esse default na leitura de QUALQUER conta que nunca salvou esse campo —
  // inclusive as que só têm o formato antigo (paymentMethodFees) configurado
  // com valores reais — mascarando a necessidade de migrar. A resolução do
  // default/migração acontece em src/lib/paymentMethods.js (resolvePaymentMethods).
  paymentMethods: {
    type: [paymentMethodSchema],
  },
  // Formato antigo (taxa fixa por chave pix/cartao_debito/cartao_credito/
  // dinheiro/convenio) — mantido só pra contas que configuraram antes dessa
  // mudança existir; GetSettingsOperation migra pro campo acima na leitura.
  paymentMethodFees: {
    type: Map,
    of: new mongoose.Schema({
      percentage: { type: Number, default: 0 },
      fixed: { type: Number, default: 0 },
    }, { _id: false }),
  },
}, { timestamps: true });

userSchema.index({ plan: 1, trialExpiresAt: 1, trialWarningSentAt: 1, isConfirmed: 1 });
userSchema.index({ plan: 1, planExpiresAt: 1, planWarningSentAt: 1, stripeSubscriptionId: 1 });
userSchema.index({ referralCode: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema);
