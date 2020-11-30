const UserModel = require("../models/User");

class UserService {
  async getUser(googleId) {
    try {
      const user = await UserModel.findOne({ googleId }).exec();
      return user;
    } catch (err) {
      return null;
    }
  }
}

module.exports = UserService;
