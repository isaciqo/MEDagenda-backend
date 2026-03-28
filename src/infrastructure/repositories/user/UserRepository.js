const User = require('../../../database/models/user/userModel');

class UserRepository {
  async findById(user_id) {
    return User.findOne({ user_id });
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findByResetToken(token) {
    return User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
  }

  async create(data) {
    const user = new User(data);
    return user.save();
  }

  async update(user_id, data) {
    return User.findOneAndUpdate({ user_id }, data, { new: true });
  }

  async delete(user_id) {
    return User.findOneAndDelete({ user_id });
  }
}

module.exports = UserRepository;
