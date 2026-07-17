const User = require('../../../database/models/user/userModel');

class UserRepository {
  async findById(user_id) {
    return User.findOne({ user_id });
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findByResetTokenHash(tokenHash) {
    return User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: Date.now() } });
  }

  async findByStripeCustomerId(stripeCustomerId) {
    return User.findOne({ stripeCustomerId });
  }

  async findByGoogleId(googleId) {
    return User.findOne({ googleId });
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

  async incrementTokenVersion(user_id) {
    return User.findOneAndUpdate({ user_id }, { $inc: { tokenVersion: 1 } }, { new: true });
  }

  async incrementLoginAttempts(user_id) {
    return User.findOneAndUpdate({ user_id }, { $inc: { loginAttempts: 1 } }, { new: true });
  }

  async lockAccount(user_id) {
    const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    return User.findOneAndUpdate({ user_id }, { loginAttempts: 5, lockUntil }, { new: true });
  }

  async resetLoginAttempts(user_id) {
    return User.findOneAndUpdate({ user_id }, { loginAttempts: 0, lockUntil: null }, { new: true });
  }

}

module.exports = UserRepository;
