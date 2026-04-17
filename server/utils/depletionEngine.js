/**
 * Depletion Estimation Engine
 * Core calculations for cylinder lifecycle management
 */

/**
 * Calculate estimated empty date
 * @param {Date} installDate - When the cylinder was installed/refilled
 * @param {Number} capacity - Total capacity (kg or L)
 * @param {Number} dailyRate - Daily consumption rate
 * @returns {Date} - Estimated empty date
 */
function calculateEstimatedEmptyDate(installDate, capacity, dailyRate) {
  if (!dailyRate || dailyRate <= 0) return null;
  const totalDays = capacity / dailyRate;
  const emptyDate = new Date(installDate);
  emptyDate.setDate(emptyDate.getDate() + totalDays);
  return emptyDate;
}

/**
 * Calculate days remaining until empty
 * @param {Date} estimatedEmptyDate
 * @returns {Number} - Days remaining (can be negative if overdue)
 */
function calculateDaysRemaining(estimatedEmptyDate) {
  if (!estimatedEmptyDate) return null;
  const now = new Date();
  const diffMs = estimatedEmptyDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Calculate percentage remaining
 * @param {Date} installDate
 * @param {Date} estimatedEmptyDate
 * @returns {Number} - Percentage (0-100)
 */
function calculatePercentageRemaining(installDate, estimatedEmptyDate) {
  if (!installDate || !estimatedEmptyDate) return 0;
  const now = new Date();
  const totalLifespan = estimatedEmptyDate.getTime() - installDate.getTime();
  const elapsed = now.getTime() - installDate.getTime();
  const remaining = Math.max(0, 1 - elapsed / totalLifespan);
  return Math.round(remaining * 100 * 100) / 100; // 2 decimal places
}

/**
 * Calculate rolling average consumption rate from sensor readings
 * @param {Array} sensorReadings - Array of { ppm, timestamp } objects
 * @param {Number} days - Number of days for rolling average
 * @returns {Number} - Average daily consumption rate
 */
function calculateRollingAverage(sensorReadings, days = 7) {
  if (!sensorReadings || sensorReadings.length === 0) return null;
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const recentReadings = sensorReadings.filter(r => new Date(r.timestamp) >= cutoff);
  if (recentReadings.length === 0) return null;

  const avgPpm = recentReadings.reduce((sum, r) => sum + r.ppm, 0) / recentReadings.length;
  // Convert average PPM to estimated daily consumption (simplified linear model)
  // This factor would be calibrated per gas type in production
  const consumptionFactor = 0.001; // kg per PPM per day (configurable)
  return Math.round(avgPpm * consumptionFactor * 1000) / 1000;
}

/**
 * Determine urgency level based on percentage remaining
 * @param {Number} percentageRemaining
 * @returns {Object} - { level, badge, color }
 */
function getUrgencyLevel(percentageRemaining) {
  if (percentageRemaining <= 0) {
    return { level: 'expired', badge: 'Empty', color: 'red' };
  } else if (percentageRemaining < 10) {
    return { level: 'critical', badge: 'Replace Immediately', color: 'red' };
  } else if (percentageRemaining < 30) {
    return { level: 'low', badge: 'Order Soon', color: 'yellow' };
  } else {
    return { level: 'normal', badge: 'Good', color: 'green' };
  }
}

/**
 * Check if consumption is higher than expected
 * @param {Number} actualRate - Measured consumption rate
 * @param {Number} expectedRate - Configured consumption rate
 * @param {Number} threshold - Percentage above expected to flag (default 20%)
 * @returns {Boolean}
 */
function isHigherThanExpected(actualRate, expectedRate, threshold = 0.2) {
  if (!actualRate || !expectedRate) return false;
  return actualRate > expectedRate * (1 + threshold);
}

module.exports = {
  calculateEstimatedEmptyDate,
  calculateDaysRemaining,
  calculatePercentageRemaining,
  calculateRollingAverage,
  getUrgencyLevel,
  isHigherThanExpected,
};
