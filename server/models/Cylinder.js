const mongoose = require('mongoose');

const refillEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  capacity: { type: Number, required: true },
  consumptionRate: { type: Number },
  performedBy: { type: String, required: true },
}, { _id: true });

const cylinderSchema = new mongoose.Schema({
  cylinderId: {
    type: String,
    required: [true, 'Cylinder ID is required'],
    unique: true,
    trim: true,
  },
  serialNumber: {
    type: String,
    trim: true,
  },
  gasType: {
    type: String,
    required: true,
    enum: ['LPG', 'CNG', 'CO2', 'Oxygen', 'Acetylene', 'Nitrogen', 'Hydrogen', 'Methane', 'Other'],
    default: 'LPG',
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 0,
  },
  capacityUnit: {
    type: String,
    enum: ['kg', 'L'],
    default: 'kg',
  },
  installDate: {
    type: Date,
    required: [true, 'Installation date is required'],
    default: Date.now,
  },
  dailyConsumptionRate: {
    type: Number,
    required: true,
    min: 0,
    default: 0.5,
  },
  estimatedEmptyDate: {
    type: Date,
  },
  percentageRemaining: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  location: {
    type: String,
    trim: true,
    default: 'Main Room',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Expired', 'Low', 'Critical'],
    default: 'Active',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  sensorId: {
    type: String,
    trim: true,
  },
  refillHistory: [refillEntrySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save: calculate estimated empty date and percentage
cylinderSchema.pre('save', function (next) {
  this.updatedAt = new Date();

  if (this.capacity && this.dailyConsumptionRate > 0 && this.installDate) {
    const totalLifespanDays = this.capacity / this.dailyConsumptionRate;
    this.estimatedEmptyDate = new Date(
      this.installDate.getTime() + totalLifespanDays * 24 * 60 * 60 * 1000
    );

    const now = new Date();
    const daysRemaining = (this.estimatedEmptyDate - now) / (24 * 60 * 60 * 1000);
    this.percentageRemaining = Math.max(0, Math.min(100, (daysRemaining / totalLifespanDays) * 100));

    // Auto-update status based on percentage
    if (this.percentageRemaining <= 0) {
      this.status = 'Expired';
    } else if (this.percentageRemaining <= 10) {
      this.status = 'Critical';
    } else if (this.percentageRemaining <= 30) {
      this.status = 'Low';
    }
  }

  next();
});

cylinderSchema.index({ status: 1 });
cylinderSchema.index({ estimatedEmptyDate: 1 });

module.exports = mongoose.model('Cylinder', cylinderSchema);
