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

    return {
      name: user.name,
      specialty: user.specialty,
      clinicAddress: user.clinicAddress || '',
      photoUrl: user.photoUrl,
      whatsappTemplate: user.whatsappTemplate,
      reviewTemplate: user.reviewTemplate,
      returnTemplate: user.returnTemplate,
      meetingLinkTemplate: user.meetingLinkTemplate,
      defaultDuration: user.defaultDuration,
      defaultConsultationValue: user.defaultConsultationValue ?? 0,
      schedule,
    };
  }
}

module.exports = GetSettingsOperation;
