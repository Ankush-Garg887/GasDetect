const SensorReading = require('../models/SensorReading');
const Cylinder = require('../models/Cylinder');
const Alert = require('../models/Alert');
const { calculateDaysRemaining, calculatePercentageRemaining } = require('../utils/depletionEngine');

// GET /api/analytics/gas — Aggregated gas data for charts
exports.getGasAnalytics = async (req, res) => {
  try {
    const { sensorId, range } = req.query;
    const now = new Date();
    let startDate;

    switch (range) {
      case '1h': startDate = new Date(now - 60 * 60 * 1000); break;
      case '6h': startDate = new Date(now - 6 * 60 * 60 * 1000); break;
      case '24h': startDate = new Date(now - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now - 24 * 60 * 60 * 1000);
    }

    const match = { timestamp: { $gte: startDate } };
    if (sensorId) match.sensorId = sensorId;

    // Daily averages for bar chart
    const dailyAverages = await SensorReading.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
          avgPpm: { $avg: '$ppm' },
          maxPpm: { $max: '$ppm' },
          minPpm: { $min: '$ppm' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Hourly heatmap data (hour of day vs day of week)
    const heatmapData = await SensorReading.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$timestamp' },
            hour: { $hour: '$timestamp' },
          },
          avgPpm: { $avg: '$ppm' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
    ]);

    // Overall stats
    const overallStats = await SensorReading.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalReadings: { $sum: 1 },
          avgPpm: { $avg: '$ppm' },
          maxPpm: { $max: '$ppm' },
          minPpm: { $min: '$ppm' },
        },
      },
    ]);

    const totalAlerts = await Alert.countDocuments({
      type: 'gas',
      timestamp: { $gte: startDate },
    });

    res.json({
      dailyAverages: dailyAverages.map((d) => ({
        date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
        avg: Math.round(d.avgPpm),
        max: Math.round(d.maxPpm),
        min: Math.round(d.minPpm),
        readings: d.count,
      })),
      heatmap: heatmapData.map((h) => ({
        dayOfWeek: h._id.dayOfWeek,
        hour: h._id.hour,
        avgPpm: Math.round(h.avgPpm),
        count: h.count,
      })),
      stats: overallStats[0] || { totalReadings: 0, avgPpm: 0, maxPpm: 0, minPpm: 0 },
      totalAlerts,
    });
  } catch (error) {
    console.error('Gas analytics error:', error);
    res.status(500).json({ message: 'Error fetching gas analytics.' });
  }
};

// GET /api/analytics/cylinders — Cylinder analytics
exports.getCylinderAnalytics = async (req, res) => {
  try {
    const cylinders = await Cylinder.find({ status: { $ne: 'Inactive' } }).lean();

    // Days remaining for each cylinder
    const daysRemainingChart = cylinders.map((c) => ({
      cylinderId: c.cylinderId,
      gasType: c.gasType,
      daysRemaining: calculateDaysRemaining(c.estimatedEmptyDate) || 0,
      percentageRemaining: calculatePercentageRemaining(c.installDate, c.estimatedEmptyDate),
    }));

    // Refill frequency per cylinder (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const refillFrequency = cylinders.map((c) => {
      const recentRefills = (c.refillHistory || []).filter(
        (r) => new Date(r.date) >= sixMonthsAgo
      );
      return {
        cylinderId: c.cylinderId,
        refillCount: recentRefills.length,
        gasType: c.gasType,
      };
    });

    // Consumption by gas type
    const consumptionByType = {};
    cylinders.forEach((c) => {
      if (!consumptionByType[c.gasType]) {
        consumptionByType[c.gasType] = { totalConsumption: 0, count: 0 };
      }
      consumptionByType[c.gasType].totalConsumption += c.dailyConsumptionRate;
      consumptionByType[c.gasType].count += 1;
    });

    const consumptionComparison = Object.entries(consumptionByType).map(([type, data]) => ({
      gasType: type,
      avgDailyConsumption: Math.round((data.totalConsumption / data.count) * 100) / 100,
      cylinderCount: data.count,
    }));

    res.json({
      daysRemainingChart,
      refillFrequency,
      consumptionComparison,
    });
  } catch (error) {
    console.error('Cylinder analytics error:', error);
    res.status(500).json({ message: 'Error fetching cylinder analytics.' });
  }
};

// GET /api/analytics/export — Export data as CSV
exports.exportData = async (req, res) => {
  try {
    const { from, to, type } = req.query;
    const query = {};

    if (from && to) {
      query.timestamp = { $gte: new Date(from), $lte: new Date(to) };
    }

    let data;
    if (type === 'cylinders') {
      data = await Cylinder.find().lean();
    } else {
      data = await SensorReading.find(query).sort({ timestamp: -1 }).limit(10000).lean();
    }

    res.json(data);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Error exporting data.' });
  }
};
