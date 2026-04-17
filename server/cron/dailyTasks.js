const cron = require('node-cron');
const Cylinder = require('../models/Cylinder');
const SensorReading = require('../models/SensorReading');
const Alert = require('../models/Alert');
const {
  calculateEstimatedEmptyDate,
  calculateDaysRemaining,
  calculatePercentageRemaining,
  calculateRollingAverage,
  getUrgencyLevel,
  isHigherThanExpected,
} = require('../utils/depletionEngine');
const { broadcastAlert } = require('../utils/socketHandler');

function initCronJobs() {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🕐 Running daily cron job: recalculating cylinder depletion...');
    await recalculateAllCylinders();
  });

  // Run every 6 hours: check for urgent depletion alerts
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔔 Running depletion alert check...');
    await checkDepletionAlerts();
  });

  console.log('✅ Cron jobs initialized');
}

async function recalculateAllCylinders() {
  try {
    const cylinders = await Cylinder.find({ status: { $in: ['Active', 'Low', 'Critical'] } });

    for (const cylinder of cylinders) {
      // Try to get sensor-based consumption rate
      if (cylinder.sensorId) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const readings = await SensorReading.find({
          sensorId: cylinder.sensorId,
          timestamp: { $gte: sevenDaysAgo },
        }).lean();

        if (readings.length > 0) {
          const sensorRate = calculateRollingAverage(readings, 7);
          if (sensorRate) {
            // Check if consumption is higher than expected
            if (isHigherThanExpected(sensorRate, cylinder.dailyConsumptionRate)) {
              await Alert.create({
                type: 'depletion',
                cylinderId: cylinder.cylinderId,
                level: 'warning',
                message: `Cylinder ${cylinder.cylinderId}: Actual consumption rate (${sensorRate}) is higher than expected (${cylinder.dailyConsumptionRate}). Recalculating estimates.`,
              });
            }
            cylinder.dailyConsumptionRate = sensorRate;
          }
        }
      }

      // Recalculate depletion
      await cylinder.save(); // Triggers pre-save hook

      console.log(`  → ${cylinder.cylinderId}: ${cylinder.percentageRemaining}% remaining, empty by ${cylinder.estimatedEmptyDate}`);
    }

    console.log(`✅ Recalculated ${cylinders.length} cylinders`);
  } catch (error) {
    console.error('❌ Cron recalculation error:', error);
  }
}

async function checkDepletionAlerts() {
  try {
    const cylinders = await Cylinder.find({ status: { $in: ['Active', 'Low', 'Critical'] } }).lean();
    const alertThresholds = [30, 15, 7, 2]; // Days remaining thresholds

    for (const cylinder of cylinders) {
      const daysRemaining = calculateDaysRemaining(cylinder.estimatedEmptyDate);
      if (daysRemaining === null) continue;

      for (const threshold of alertThresholds) {
        if (daysRemaining <= threshold && daysRemaining > threshold - 1) {
          // Check if we already sent this alert recently (within 24 hours)
          const recentAlert = await Alert.findOne({
            type: 'depletion',
            cylinderId: cylinder.cylinderId,
            message: { $regex: `${threshold} day` },
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          });

          if (!recentAlert) {
            const level = threshold <= 2 ? 'critical' : threshold <= 7 ? 'danger' : 'warning';
            const alert = await Alert.create({
              type: 'depletion',
              cylinderId: cylinder.cylinderId,
              level,
              message: `Cylinder ${cylinder.cylinderId} estimated to be empty in ${Math.ceil(daysRemaining)} days (${cylinder.estimatedEmptyDate?.toLocaleDateString()}). ${threshold <= 7 ? 'Immediate attention required!' : 'Plan replacement soon.'}`,
            });
            broadcastAlert(alert);
          }
        }
      }

      // Alert when below 20% remaining
      const percentage = calculatePercentageRemaining(cylinder.installDate, cylinder.estimatedEmptyDate);
      if (percentage <= 20 && percentage > 0) {
        const recentPercentAlert = await Alert.findOne({
          type: 'depletion',
          cylinderId: cylinder.cylinderId,
          message: { $regex: 'below 20%' },
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (!recentPercentAlert) {
          const alert = await Alert.create({
            type: 'depletion',
            cylinderId: cylinder.cylinderId,
            level: 'danger',
            message: `Cylinder ${cylinder.cylinderId} is below 20% estimated remaining (${percentage.toFixed(1)}%). Order replacement.`,
          });
          broadcastAlert(alert);
        }
      }
    }
  } catch (error) {
    console.error('❌ Depletion alert check error:', error);
  }
}

module.exports = { initCronJobs, recalculateAllCylinders, checkDepletionAlerts };
