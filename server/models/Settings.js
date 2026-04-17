const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
  },
  refreshInterval: {
    type: Number,
    enum: [1, 2, 5, 10],
    default: 2,
  },
  sensorType: {
    type: String,
    enum: ['MQ-2', 'MQ-3', 'MQ-4', 'MQ-5', 'MQ-6', 'MQ-7', 'MQ-8', 'MQ-9', 'MQ-135'],
    default: 'MQ-2',
  },
  thresholds: {
    type: Map,
    of: {
      warning: { type: Number, default: 400 },
      danger: { type: Number, default: 800 },
    },
    default: {
      LPG: { warning: 400, danger: 800 },
      CO: { warning: 50, danger: 200 },
      CO2: { warning: 1000, danger: 5000 },
      Methane: { warning: 500, danger: 1000 },
    },
  },
  mqttBroker: {
    type: String,
    default: '',
  },
  apiEndpoint: {
    type: String,
    default: 'http://localhost:5000/api/sensor/data',
  },
  darkMode: {
    type: Boolean,
    default: true,
  },
  soundEnabled: {
    type: Boolean,
    default: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Settings', settingsSchema);
