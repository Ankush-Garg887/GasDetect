const SensorReading = require('../models/SensorReading');
const Alert = require('../models/Alert');
const Settings = require('../models/Settings');
const { broadcastSensorData, broadcastAlert } = require('../utils/socketHandler');

// Store the last 50 requests for system logs
const systemLogs = [];
const MAX_LOGS = 50;

function addSystemLog(entry) {
  systemLogs.unshift({ ...entry, timestamp: new Date() });
  if (systemLogs.length > MAX_LOGS) systemLogs.pop();
}

// POST /api/sensor/data — NodeMCU sends data here
exports.postSensorData = async (req, res) => {
  try {
    const { sensorId, ppm, gasType, timestamp } = req.body;

    if (!sensorId || ppm === undefined) {
      return res.status(400).json({ message: 'sensorId and ppm are required.' });
    }

    const reading = await SensorReading.create({
      sensorId,
      ppm: Number(ppm),
      gasType: gasType || 'LPG',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Log the request
    addSystemLog({
      method: 'POST',
      endpoint: '/api/sensor/data',
      sensorId,
      ppm,
      gasType,
      ip: req.ip,
    });

    // Broadcast to dashboard via Socket.io
    broadcastSensorData(reading);

    // Check thresholds and create alert if needed
    await checkThresholds(reading);

    res.status(201).json({ message: 'Data received', reading });
  } catch (error) {
    console.error('Sensor data error:', error);
    res.status(500).json({ message: 'Error saving sensor data.' });
  }
};

// Check if reading exceeds thresholds
async function checkThresholds(reading) {
  try {
    // Get default thresholds
    const defaultThresholds = {
      LPG: { warning: 400, danger: 800 },
      CO: { warning: 50, danger: 200 },
      CO2: { warning: 1000, danger: 5000 },
      Methane: { warning: 500, danger: 1000 },
    };

    const gasThresholds = defaultThresholds[reading.gasType] || { warning: 400, danger: 800 };

    let alertLevel = null;
    let alertMessage = '';

    if (reading.ppm >= gasThresholds.danger) {
      alertLevel = 'danger';
      alertMessage = `DANGER: ${reading.gasType} level at ${reading.ppm} PPM from sensor ${reading.sensorId}! Exceeds danger threshold of ${gasThresholds.danger} PPM.`;
    } else if (reading.ppm >= gasThresholds.warning) {
      alertLevel = 'warning';
      alertMessage = `WARNING: ${reading.gasType} level at ${reading.ppm} PPM from sensor ${reading.sensorId}. Exceeds warning threshold of ${gasThresholds.warning} PPM.`;
    }

    if (alertLevel) {
      const alert = await Alert.create({
        type: 'gas',
        sensorId: reading.sensorId,
        level: alertLevel,
        ppm: reading.ppm,
        message: alertMessage,
      });
      broadcastAlert(alert);
    }
  } catch (error) {
    console.error('Threshold check error:', error);
  }
}

// GET /api/sensor/latest
exports.getLatestReading = async (req, res) => {
  try {
    const { sensorId } = req.query;
    const query = sensorId ? { sensorId } : {};
    
    // Get latest reading per sensor
    const sensors = await SensorReading.aggregate([
      { $match: query },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$sensorId',
          sensorId: { $first: '$sensorId' },
          ppm: { $first: '$ppm' },
          gasType: { $first: '$gasType' },
          timestamp: { $first: '$timestamp' },
        },
      },
    ]);

    // Get today's stats per sensor
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayStats = await SensorReading.aggregate([
      { $match: { ...query, timestamp: { $gte: startOfDay } } },
      {
        $group: {
          _id: '$sensorId',
          maxPpm: { $max: '$ppm' },
          minPpm: { $min: '$ppm' },
          avgPpm: { $avg: '$ppm' },
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = {};
    todayStats.forEach((s) => {
      statsMap[s._id] = {
        max: Math.round(s.maxPpm),
        min: Math.round(s.minPpm),
        avg: Math.round(s.avgPpm),
        readings: s.count,
      };
    });

    const result = sensors.map((s) => ({
      ...s,
      todayStats: statsMap[s.sensorId] || { max: 0, min: 0, avg: 0, readings: 0 },
    }));

    res.json(result);
  } catch (error) {
    console.error('Latest reading error:', error);
    res.status(500).json({ message: 'Error fetching latest readings.' });
  }
};

// GET /api/sensor/history
exports.getHistory = async (req, res) => {
  try {
    const { sensorId, range, from, to } = req.query;
    const query = {};

    if (sensorId) query.sensorId = sensorId;

    // Time range filter
    const now = new Date();
    let startDate;

    if (from && to) {
      query.timestamp = { $gte: new Date(from), $lte: new Date(to) };
    } else {
      switch (range) {
        case '1h':
          startDate = new Date(now - 60 * 60 * 1000);
          break;
        case '6h':
          startDate = new Date(now - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now - 60 * 60 * 1000); // Default: 1h
      }
      query.timestamp = { $gte: startDate };
    }

    const readings = await SensorReading.find(query)
      .sort({ timestamp: -1 })
      .limit(5000)
      .lean();

    res.json(readings);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ message: 'Error fetching history.' });
  }
};

// GET /api/sensor/logs — System logs
exports.getSystemLogs = async (req, res) => {
  res.json(systemLogs);
};
