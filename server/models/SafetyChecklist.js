const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  checked: { type: Boolean, default: false },
}, { _id: false });

const safetyChecklistSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily',
  },
  items: [checklistItemSchema],
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  submittedBy: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

safetyChecklistSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('SafetyChecklist', safetyChecklistSchema);
