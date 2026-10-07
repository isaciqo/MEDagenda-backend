class GetPublicBookingInfoOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(code) {
    const user = await this.userRepository.findByPublicBookingCode(code);
    if (!user || !user.publicBookingEnabled) {
      const error = new Error('Link inválido ou agendamento público desativado');
      error.statusCode = 400;
      throw error;
    }

    return {
      doctorName: user.displayName || user.name,
      duration: user.publicBookingDuration || user.defaultDuration || 30,
    };
  }
}

module.exports = GetPublicBookingInfoOperation;
