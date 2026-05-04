const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const { AppError, Errors } = require('../../errors/AppError');

class InviteMemberService extends BaseService {
  async run() {
    const { email, role = 'member' } = this.args;

    // Check if user already exists in profiles
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      throw new AppError(Errors.BAD_REQUEST, {
        message: 'A user with this email already exists',
      });
    }

    // Use Supabase Admin API to invite the user by email
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: this.args.name || email.split('@')[0],
        role,
        org_name: this.user?.org_name || null,
      },
    });

    if (error) {
      throw new AppError(Errors.INTERNAL_ERROR, {
        message: `Failed to send invite: ${error.message}`,
      });
    }

    // Update the profile with the correct role if the trigger created it with 'member'
    if (data?.user?.id && role !== 'member') {
      await supabase
        .from('profiles')
        .update({ role, org_name: this.user?.org_name })
        .eq('id', data.user.id);
    }

    return {
      message: `Invite sent to ${email}`,
      email,
      role,
      invitedBy: this.user?.full_name || this.user?.email || 'Admin',
      invitedAt: new Date().toISOString(),
    };
  }
}

module.exports = InviteMemberService;
