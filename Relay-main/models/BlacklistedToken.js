const mongoose = require('mongoose');

const BlacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // Automatically delete when expiresAt is reached
  },
});

module.exports = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);
