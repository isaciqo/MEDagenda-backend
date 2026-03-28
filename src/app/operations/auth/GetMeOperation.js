class GetMeOperation {
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

    return {
      id: user.user_id,
      email: user.email,
      name: user.name,
      specialty: user.specialty,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
    };
  }
}

module.exports = GetMeOperation;
