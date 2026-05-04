const BaseService = require('../BaseService');
// Models removed
// Models removed
const { AppError, Errors } = require('../../errors/AppError');
const { randomBytes } = require('crypto');

class InviteMemberService extends BaseService {
  async run() {
    const { email, role = 'member' } = this.args;
    const existing = await User.findOne({ email });
    
    if (existing) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'A user with this email already exists' });
    }

    // Generate a secure random token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await InviteToken.create({
      email,
      role,
      orgId: this.user.orgId,
      orgName: this.user.orgName,
      invitedBy: this.user._id,
      token,
      expiresAt
    });

    // Mock sending email
    this.context.logger.info(`[MOCK EMAIL] Invite Link for ${email}: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/join?token=${token}`);

    return {
      message: `Invite sent to ${email}`,
      email,
      role,
      invitedBy: this.user.name,
      invitedAt: new Date().toISOString()
    };
  }
}

module.exports = InviteMemberService;
