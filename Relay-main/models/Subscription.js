const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  tier: { type: String, enum: ['free', 'starter', 'growth', 'scale', 'enterprise'], default: 'free' },
  status: { type: String, enum: ['active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'], default: 'active' },
  currentPeriodEnd: { type: Date, default: null },
  transactionsUsedThisMonth: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
