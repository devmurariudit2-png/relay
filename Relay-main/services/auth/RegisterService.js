const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const BaseService = require("../BaseService");
const User = require("../../models/User");
const { AppError, Errors } = require("../../errors/AppError");

class RegisterService extends BaseService {
  signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  }

  async run() {
    const { name, email, password } = this.args;

    if (await User.findOne({ email })) {
      throw new AppError(Errors.BAD_REQUEST, {
        message: "Email already registered",
      });
    }

    const orgId = randomUUID();
    const orgName = `${name}'s Organization`;

    const user = await User.create({
      name,
      email,
      password,
      orgId,
      orgName,
      role: "member",
    });
    return { token: this.signToken(user._id), user: user.toSafeObject() };
  }
}

module.exports = RegisterService;
