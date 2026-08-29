const { resolvePaymentMethods, DEFAULT_PAYMENT_METHODS } = require('../../../lib/paymentMethods');

class UpdateSettingsOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id, data) {
    const existing = await this.userRepository.findById(user_id);
    if (!existing) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.specialty !== undefined) updateData.specialty = data.specialty;
    if (data.clinicAddress !== undefined) updateData.clinicAddress = data.clinicAddress;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.whatsappTemplate !== undefined) updateData.whatsappTemplate = data.whatsappTemplate;
    if (data.reviewTemplate !== undefined) updateData.reviewTemplate = data.reviewTemplate;
    if (data.returnTemplate !== undefined) updateData.returnTemplate = data.returnTemplate;
    if (data.meetingLinkTemplate !== undefined) updateData.meetingLinkTemplate = data.meetingLinkTemplate;
    if (data.rescheduleAcceptedTemplate !== undefined) updateData.rescheduleAcceptedTemplate = data.rescheduleAcceptedTemplate;
    if (data.defaultDuration !== undefined) updateData.defaultDuration = data.defaultDuration;
    if (data.defaultConsultationValue !== undefined) updateData.defaultConsultationValue = data.defaultConsultationValue;
    if (data.allowPatientReschedule !== undefined) updateData.allowPatientReschedule = data.allowPatientReschedule;
    if (data.schedule !== undefined) updateData.schedule = data.schedule;
    // Lista inteira, o médico controla os itens (adicionar/renomear/remover) —
    // diferente do Map de chave fixa antigo, aqui não precisa de merge com
    // default: o que vier é a lista completa e final. Exceto pelas formas de
    // pagamento padrão (pix/débito/crédito/convênio): a interface já impede a
    // remoção delas, mas reforça aqui pra não depender só do front-end — se
    // uma faltar na lista recebida, é readicionada com o valor que o médico já
    // tinha configurado pra ela (ou o default, se nunca configurou).
    if (data.paymentMethods !== undefined) {
      const incomingIds = new Set(data.paymentMethods.map(m => m.id));
      const existingResolved = resolvePaymentMethods(existing);
      const missingDefaults = DEFAULT_PAYMENT_METHODS
        .filter(d => !incomingIds.has(d.id))
        .map(d => existingResolved.find(m => m.id === d.id) || d);
      updateData.paymentMethods = [...data.paymentMethods, ...missingDefaults];
    }

    const updated = await this.userRepository.update(user_id, updateData);

    const schedule = updated.schedule instanceof Map
      ? Object.fromEntries(updated.schedule)
      : updated.schedule;

    return {
      name: updated.name,
      specialty: updated.specialty,
      clinicAddress: updated.clinicAddress || '',
      photoUrl: updated.photoUrl,
      whatsappTemplate: updated.whatsappTemplate,
      reviewTemplate: updated.reviewTemplate,
      returnTemplate: updated.returnTemplate,
      meetingLinkTemplate: updated.meetingLinkTemplate,
      rescheduleAcceptedTemplate: updated.rescheduleAcceptedTemplate,
      defaultDuration: updated.defaultDuration,
      defaultConsultationValue: updated.defaultConsultationValue ?? 0,
      allowPatientReschedule: updated.allowPatientReschedule ?? true,
      schedule,
      paymentMethods: resolvePaymentMethods(updated),
    };
  }
}

module.exports = UpdateSettingsOperation;
