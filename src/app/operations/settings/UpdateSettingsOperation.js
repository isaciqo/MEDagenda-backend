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
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.whatsappTemplate !== undefined) updateData.whatsappTemplate = data.whatsappTemplate;
    if (data.defaultDuration !== undefined) updateData.defaultDuration = data.defaultDuration;
    if (data.schedule !== undefined) updateData.schedule = data.schedule;

    const updated = await this.userRepository.update(user_id, updateData);

    const schedule = updated.schedule instanceof Map
      ? Object.fromEntries(updated.schedule)
      : updated.schedule;

    return {
      name: updated.name,
      specialty: updated.specialty,
      photoUrl: updated.photoUrl,
      whatsappTemplate: updated.whatsappTemplate,
      defaultDuration: updated.defaultDuration,
      schedule,
    };
  }
}

module.exports = UpdateSettingsOperation;
