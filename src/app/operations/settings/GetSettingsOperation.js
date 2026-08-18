class GetSettingsOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const schedule = user.schedule instanceof Map
      ? Object.fromEntries(user.schedule)
      : user.schedule;

    const paymentMethodFees = user.paymentMethodFees instanceof Map
      ? Object.fromEntries(user.paymentMethodFees)
      : user.paymentMethodFees;

    return {
      name: user.name,
      specialty: user.specialty,
      clinicAddress: user.clinicAddress || '',
      photoUrl: user.photoUrl,
      whatsappTemplate: user.whatsappTemplate,
      reviewTemplate: user.reviewTemplate,
      returnTemplate: user.returnTemplate,
      meetingLinkTemplate: user.meetingLinkTemplate,
      rescheduleAcceptedTemplate: user.rescheduleAcceptedTemplate,
      defaultDuration: user.defaultDuration,
      defaultConsultationValue: user.defaultConsultationValue ?? 0,
      allowPatientReschedule: user.allowPatientReschedule ?? true,
      schedule,
      paymentMethodFees,
    };
  }
}

module.exports = GetSettingsOperation;
