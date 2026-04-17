const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['gas', 'depletion', 'maintenance', 'system'],
    required: true,
  },
  sensorId: {
    type: String,
    trim: true,
  },
  cylinderId: {
    type: String,
    trim: true,
  },
  level: {
    type: String,
    enum: ['info', 'warning', 'danger', 'critical'],
    required: true,
    default: 'warning',
  },
  ppm: {
    type: Number,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  acknowledged: {
    type: Boolean,
    default: false,
  },
  acknowledgedBy: {
    type: String,
  },
  acknowledgedAt: {
    type: Date,
  },
});

alertSchema.index({ type: 1, timestamp: -1 });
alertSchema.index({ acknowledged: 1 });

module.exports = mongoose.model('Alert', alertSchema);
