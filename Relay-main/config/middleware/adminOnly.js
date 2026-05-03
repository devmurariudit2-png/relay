// Re-export from auth.js for backwards compatibility
const { adminOnly } = require('./auth');
module.exports = adminOnly;
