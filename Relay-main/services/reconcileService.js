const supabase = require('../config/supabase');

const reconcileUser = async (userId) => {
  if (process.env.SUPABASE_URL) {
    // Reconciliation is handled via BaseService.execute -> handleMockRequest
    // This function is called by jobService for background jobs
    const ReconcileService = require('./transactions/ReconcileService');
    return await ReconcileService.execute({}, { user: { id: userId, _id: userId } });
  }
  const reconcileEngine = require('../config/reconcile');
  return reconcileEngine(userId);
};

module.exports = { reconcileUser };
