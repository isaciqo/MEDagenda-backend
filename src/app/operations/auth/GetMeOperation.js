class GetMeOperation {
  constructor({ userRepository, planService, appointmentRepository }) {
    this.userRepository = userRepository;
    this.planService = planService;
    this.appointmentRepository = appointmentRepository;
  }

  async execute(user_id) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const now = new Date();
    const monthlyCount = await this.appointmentRepository.countByDoctorAndMonth(
      user_id,
      now.getFullYear(),
      now.getMonth() + 1
    );

    return {
      id: user.user_id,
      email: user.email,
      name: user.name,
      specialty: user.specialty,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      onboardingCompleted: user.onboardingCompleted ?? false,
      followUpMode: user.followUpMode ?? null,
      plantaoEnabled: user.plantaoEnabled ?? false,
      consultaEnabled: user.consultaEnabled ?? true,
      isGoogleLinked: !!user.googleId,
      pendingEmail: user.pendingEmail ?? null,
      pendingEmailRequestedAt: user.pendingEmailRequestedAt ?? null,
      ...this.planService.buildPlanInfo(user, monthlyCount),
    };
  }
}

module.exports = GetMeOperation;
