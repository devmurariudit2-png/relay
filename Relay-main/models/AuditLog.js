const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:  { type: String, required: true },
  entity:  { type: String, required: true },
  entityId:{ type: String, default: null },
  details: { type: Object, default: {} },
  ip:      { type: String, default: null },
}, { timestamps: true });

auditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditSchema);
