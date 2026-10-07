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

// Config de recebimento via Pix: a chave do médico e os dados do recebedor
// (nome/cidade) usados pra montar o "Pix copia e cola" no frontend. Sem
// gateway e sem confirmação automática de pagamento, é só um facilitador.
const pixConfigSchema = new mongoose.Schema({
  key: { type: String, default: '' },
  keyType: { type: String, enum: ['cpf', 'cnpj', 'email', 'phone', 'evp', ''], default: '' },
  receiverName: { type: String, default: '' },
  receiverCity: { type: String, default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  // Nome de cadastro (obrigatório) — identifica a conta, não é enviado ao cliente.
  name: { type: String, required: true },
  // Como o profissional quer ser chamado nas mensagens ao cliente (ex: "Dr. Carlos").
  // Campo separado de `name` de propósito: mudar um não pode sobrescrever o outro.
  // '' (vazio) cai no fallback pra `name` em quem nunca configurou isso.
  displayName: { type: String, default: '' },
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
  pixMessageTemplate: { type: String, default: 'Olá {cliente}! Para pagar sua consulta ({valor}), faça um Pix para a chave {chave} ({nome_recebedor}). Depois me envie o comprovante, por favor.' },
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
  // Marca o envio do e-mail de cupom de desconto perto do fim do trial (ver
  // TrialDiscountJob) — separado de trialWarningSentAt pra poder ligar/desligar
  // e reenviar esse e-mail de oferta sem mexer no aviso genérico de expiração.
  trialDiscountSentAt: { type: Date, default: null },
  // Marca o envio do lembrete de renovação automática (ver PlanRenewalReminderJob)
  // — caso oposto do planWarningSentAt: aqui a assinatura está ATIVA
  // (stripeSubscriptionId preenchido) e vai cobrar de novo sozinha, não expirar.
  planRenewalWarningSentAt: { type: Date, default: null },
  // Quando o último e-mail de confirmação foi enviado (cadastro inicial ou
  // reenvio). Serve de cooldown: se a pessoa tenta logar ou clica num link de
  // confirmação expirado, só reenviamos se já passou mais de 24h daqui.
  lastConfirmationEmailSentAt: { type: Date, default: null },
  onboardingCompleted: { type: Boolean, default: false },
  referralCode: { type: String, default: null, sparse: true },
  referralRewardGrantedAt: { type: Date, default: null },
  pendingReferralCode: { type: String, default: null },
  // Código do link público de autocadastro de cliente (ver GetPatientIntakeLinkOperation)
  // — mesmo padrão do referralCode: gerado sob demanda na primeira vez que o
  // médico abre a tela, nunca no cadastro da conta. Médico pode gerar um novo
  // (invalida o antigo) se o link vazar em algum lugar indevido.
  // Índice sparse é declarado só abaixo (userSchema.index) — não repete aqui
  // pra não duplicar (mesmo aviso que já existe em referralCode: declarar
  // sparse:true no path E de novo via .index() cria dois índices iguais).
  patientIntakeCode: { type: String, default: null },
  followUpMode: { type: String, enum: ['paid_recurrence', 'return', 'free'], default: null },
  allowPatientReschedule: { type: Boolean, default: true },
  // Página pública de agendamento (link fixo, compartilhável com qualquer pessoa,
  // diferente do link de remarcação que é por consulta). Desligado por padrão —
  // só existe pra quem ativa conscientemente em Configurações.
  publicBookingEnabled: { type: Boolean, default: false },
  // null = usa defaultDuration (mesmo padrão de "sem valor próprio, cai no
  // padrão do médico" já usado em outros lugares do agendamento).
  publicBookingDuration: { type: Number, default: null },
  // false = todo pedido feito pela página pública nasce com status
  // 'aguardando_confirmacao' e precisa ser aceito manualmente (ver
  // AcceptBookingRequestOperation). true = já nasce 'agendado'.
  publicBookingAutoAccept: { type: Boolean, default: false },
  // Mesmo padrão do patientIntakeCode: gerado sob demanda na primeira vez que o
  // médico abre a tela, regenerável (invalida o link antigo).
  publicBookingCode: { type: String, default: null },
  // Fixado como "ambos" (true) já na criação da conta — se a pessoa pular o
  // onboarding inteiro, continua com acesso a tudo, sem precisar ativar nada
  // depois. Controla se a aba de Plantão aparece na Agenda, se a cor aparece
  // na tela de Locais, e se o financeiro/dashboard consulta a coleção Shift.
  // Escalar com default é seguro aqui (o cuidado documentado em paymentMethods
  // logo abaixo é especificamente sobre default em ARRAY).
  plantaoEnabled: { type: Boolean, default: true },
  // Junto com plantaoEnabled, define o "modo de atendimento": consultaEnabled
  // false + plantaoEnabled true = só plantão (esconde Clientes/Avaliações na
  // navegação, some com as seções de consulta em Configurações). Default true
  // também — conta nova nasce em "ambos" (os dois true), e só vira "só
  // plantão" se a pessoa desativar consulta depois, de propósito.
  consultaEnabled: { type: Boolean, default: true },
  // Marca que a migração única de endereços antigos de consulta pra Location já
  // rodou pra esse médico (ver ListLocationsOperation). Sem isso, a condição
  // era "lista de Locations está vazia agora" — o que faz endereços de teste
  // antigos ressuscitarem sozinhos toda vez que o médico apaga todos os
  // Locais, não só na primeira vez de verdade.
  locationsMigrated: { type: Boolean, default: false },
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
  // Aqui `default` é seguro (não é array mascarando migração legada como
  // paymentMethods): garante que o GET de settings sempre devolve o shape.
  pix: { type: pixConfigSchema, default: () => ({}) },
}, { timestamps: true });

userSchema.index({ plan: 1, trialExpiresAt: 1, trialWarningSentAt: 1, isConfirmed: 1 });
userSchema.index({ plan: 1, trialExpiresAt: 1, trialDiscountSentAt: 1, isConfirmed: 1 });
userSchema.index({ plan: 1, planExpiresAt: 1, planWarningSentAt: 1, stripeSubscriptionId: 1 });
userSchema.index({ plan: 1, planExpiresAt: 1, planRenewalWarningSentAt: 1, stripeSubscriptionId: 1 });
userSchema.index({ referralCode: 1 }, { sparse: true });
userSchema.index({ patientIntakeCode: 1 }, { sparse: true });
userSchema.index({ publicBookingCode: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema);
