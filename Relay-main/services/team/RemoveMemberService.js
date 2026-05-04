const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const { AppError, Errors } = require('../../errors/AppError');

class RemoveMemberService extends BaseService {
  async run() {
    const { targetUserId } = this.args;

    if (String(targetUserId) === String(this.userId)) {
      throw new AppError(Errors.BAD_REQUEST, {
        message: 'Cannot remove yourself',
      });
    }

    // Verify the user exists first
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (!profile) {
      throw new AppError(Errors.NOT_FOUND, { message: 'User not found' });
    }

    // Delete the user via Supabase Auth Admin API (cascades to profiles)
    const { error } = await supabase.auth.admin.deleteUser(targetUserId);
    if (error) {
      throw new AppError(Errors.INTERNAL_ERROR, {
        message: `Failed to remove member: ${error.message}`,
      });
    }

    return { deleted: targetUserId };
  }
}

module.exports = RemoveMemberService;
