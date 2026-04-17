const mongoose = require('mongoose');

const maintenanceScheduleSchema = new mongoose.Schema({
  cylinderId: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  nextInspectionDate: {
    type: Date,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  completedBy: {
    type: String,
  },
  createdBy: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

maintenanceScheduleSchema.index({ nextInspectionDate: 1, completed: 1 });

module.exports = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
