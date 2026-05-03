const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:  { type: String, required: true },
  entity:  { type: String, required: true },
  entityId:{ type: String, default: null },
  details: { type: Object, default: {} },
  ip:      { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditSchema);
