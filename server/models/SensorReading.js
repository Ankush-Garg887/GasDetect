const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  ppm: {
    type: Number,
    required: true,
    min: 0,
  },
  gasType: {
    type: String,
    required: true,
    enum: ['LPG', 'CO', 'CO2', 'Methane', 'CNG', 'Oxygen', 'Acetylene', 'NH3', 'Other'],
    default: 'LPG',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: auto-delete readings older than 90 days
sensorReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound index for common queries
sensorReadingSchema.index({ sensorId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
