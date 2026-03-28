class DeleteUserOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('User not found');
    }
    await this.userRepository.delete(user_id);
    return { message: 'User deleted successfully' };
  }
}

module.exports = DeleteUserOperation;
