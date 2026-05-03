const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 100 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  currency: { type: String, default: 'USD' },
  active:   { type: Boolean, default: true },

  // ── Multi-tenancy ──────────────────────────────────────────────────────────
  orgId:    { type: String, default: null, index: true }, // org/tenant identifier
  orgName:  { type: String, default: null },              // human-readable org name

  // ── Security ───────────────────────────────────────────────────────────────
  lastLoginAt:    { type: Date, default: null },
  loginCount:     { type: Number, default: 0 },
  passwordChangedAt: { type: Date, default: null },
}, { timestamps: true });

// Index for fast org-scoped queries
userSchema.index({ orgId: 1, role: 1 });
userSchema.index({ orgId: 1, email: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    currency: this.currency,
    orgId: this.orgId,
    orgName: this.orgName,
    active: this.active,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
