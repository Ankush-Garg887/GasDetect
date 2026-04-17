const Alert = require('../models/Alert');

// GET /api/alerts
exports.getAlerts = async (req, res) => {
  try {
    const { type, level, acknowledged, limit, page } = req.query;
    const query = {};

    if (type) query.type = type;
    if (level) query.level = level;
    if (acknowledged !== undefined) query.acknowledged = acknowledged === 'true';

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [alerts, total] = await Promise.all([
      Alert.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum).lean(),
      Alert.countDocuments(query),
    ]);

    res.json({
      alerts,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Error fetching alerts.' });
  }
};

// PUT /api/alerts/:id/ack — Acknowledge alert
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        acknowledged: true,
        acknowledgedBy: req.user ? req.user.name : 'Unknown',
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ message: 'Error acknowledging alert.' });
  }
};

// GET /api/alerts/stats — Alert statistics
exports.getAlertStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now); startOfMonth.setDate(now.getDate() - 30);

    const [today, week, month, byLevel] = await Promise.all([
      Alert.countDocuments({ timestamp: { $gte: startOfToday } }),
      Alert.countDocuments({ timestamp: { $gte: startOfWeek } }),
      Alert.countDocuments({ timestamp: { $gte: startOfMonth } }),
      Alert.aggregate([
        { $match: { timestamp: { $gte: startOfMonth } } },
        { $group: { _id: '$level', count: { $sum: 1 } } },
      ]),
    ]);

    const levelStats = {};
    byLevel.forEach((b) => { levelStats[b._id] = b.count; });

    res.json({ today, thisWeek: week, thisMonth: month, byLevel: levelStats });
  } catch (error) {
    console.error('Alert stats error:', error);
    res.status(500).json({ message: 'Error fetching alert stats.' });
  }
};
