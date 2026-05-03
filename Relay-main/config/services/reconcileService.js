const reconcileEngine = require('../config/reconcile');

const reconcileUser = async (userId) => {
  return reconcileEngine(userId);
};

module.exports = { reconcileUser };
