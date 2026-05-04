const supabase = require('../config/supabase');

const reconcileUser = async (userId) => {
  const ReconcileService = require('./transactions/ReconcileService');
  return await ReconcileService.execute({}, { user: { id: userId, _id: userId } });
};

module.exports = { reconcileUser };
