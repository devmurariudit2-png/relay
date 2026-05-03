const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orgId:       { type: String, default: null, index: true },  // multi-tenancy
  date:        { type: String, required: true },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  amount:      { type: Number, required: true },
  currency:    { type: String, default: 'USD', uppercase: true },
  reference:   { type: String, default: null, trim: true },
  source:      { type: String, enum: ['bank', 'internal'], required: true },
  category:    { type: String, default: null, trim: true },
  note:        { type: String, default: null, trim: true, maxlength: 1000 },
  status:      { type: String, enum: ['pending', 'matched', 'unmatched', 'exception', 'duplicate'], default: 'pending', index: true },
  matched_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
}, { timestamps: true });

// Compound indexes for common query patterns
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ user: 1, source: 1 });
transactionSchema.index({ user: 1, date: 1 });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ orgId: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
