const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const { AppError, Errors } = require('../../errors/AppError');

class UpdateRoleService extends BaseService {
  async run() {
    const { targetUserId, role } = this.args;

    if (String(targetUserId) === String(this.userId)) {
      throw new AppError(Errors.BAD_REQUEST, {
        message: 'Cannot change your own role',
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(Errors.NOT_FOUND, { message: 'User not found' });
    }

    return {
      _id: data.id,
      name: data.full_name || data.email,
      email: data.email,
      role: data.role,
    };
  }
}

module.exports = UpdateRoleService;
