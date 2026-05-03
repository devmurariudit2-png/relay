const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' }, 
  priority:    { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  category:    { type: String, enum: ['bug', 'feature', 'billing', 'access', 'other'], default: 'other' },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  comments: [{
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message:   { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
