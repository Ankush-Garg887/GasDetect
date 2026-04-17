const Cylinder = require('../models/Cylinder');
const Alert = require('../models/Alert');
const { calculateDaysRemaining, calculatePercentageRemaining, getUrgencyLevel } = require('../utils/depletionEngine');
const { broadcastCylinderUpdate, broadcastAlert } = require('../utils/socketHandler');

// POST /api/cylinders — Add new cylinder
exports.createCylinder = async (req, res) => {
  try {
    const {
      cylinderId, serialNumber, gasType, capacity, capacityUnit,
      installDate, dailyConsumptionRate, location, status, notes, sensorId,
    } = req.body;

    const existing = await Cylinder.findOne({ cylinderId });
    if (existing) {
      return res.status(400).json({ message: 'Cylinder ID already exists.' });
    }

    const cylinder = await Cylinder.create({
      cylinderId, serialNumber, gasType, capacity,
      capacityUnit: capacityUnit || 'kg',
      installDate: installDate || new Date(),
      dailyConsumptionRate: dailyConsumptionRate || 0.5,
      location, status: status || 'Active', notes, sensorId,
    });

    res.status(201).json(cylinder);
  } catch (error) {
    console.error('Create cylinder error:', error);
    res.status(500).json({ message: 'Error creating cylinder.' });
  }
};

// GET /api/cylinders — List all cylinders
exports.getCylinders = async (req, res) => {
  try {
    const { gasType, status, search, urgency } = req.query;
    const query = {};

    if (gasType) query.gasType = gasType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { cylinderId: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    let cylinders = await Cylinder.find(query).sort({ estimatedEmptyDate: 1 }).lean();

    // Enrich with urgency data
    cylinders = cylinders.map((c) => {
      const daysRemaining = calculateDaysRemaining(c.estimatedEmptyDate);
      const percentage = calculatePercentageRemaining(c.installDate, c.estimatedEmptyDate);
      const urgencyInfo = getUrgencyLevel(percentage);
      return { ...c, daysRemaining, percentageRemaining: percentage, urgency: urgencyInfo };
    });

    // Filter by urgency if requested
    if (urgency) {
      cylinders = cylinders.filter((c) => c.urgency.level === urgency);
    }

    res.json(cylinders);
  } catch (error) {
    console.error('Get cylinders error:', error);
    res.status(500).json({ message: 'Error fetching cylinders.' });
  }
};

// GET /api/cylinders/:id — Get single cylinder
exports.getCylinder = async (req, res) => {
  try {
    const cylinder = await Cylinder.findById(req.params.id).lean();
    if (!cylinder) {
      return res.status(404).json({ message: 'Cylinder not found.' });
    }

    const daysRemaining = calculateDaysRemaining(cylinder.estimatedEmptyDate);
    const percentage = calculatePercentageRemaining(cylinder.installDate, cylinder.estimatedEmptyDate);
    const urgencyInfo = getUrgencyLevel(percentage);

    res.json({ ...cylinder, daysRemaining, percentageRemaining: percentage, urgency: urgencyInfo });
  } catch (error) {
    console.error('Get cylinder error:', error);
    res.status(500).json({ message: 'Error fetching cylinder.' });
  }
};

// PUT /api/cylinders/:id — Edit cylinder
exports.updateCylinder = async (req, res) => {
  try {
    const cylinder = await Cylinder.findById(req.params.id);
    if (!cylinder) {
      return res.status(404).json({ message: 'Cylinder not found.' });
    }

    const allowedFields = [
      'cylinderId', 'serialNumber', 'gasType', 'capacity', 'capacityUnit',
      'installDate', 'dailyConsumptionRate', 'location', 'status', 'notes', 'sensorId',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        cylinder[field] = req.body[field];
      }
    });

    await cylinder.save(); // Triggers pre-save hook for depletion recalc
    broadcastCylinderUpdate(cylinder);

    res.json(cylinder);
  } catch (error) {
    console.error('Update cylinder error:', error);
    res.status(500).json({ message: 'Error updating cylinder.' });
  }
};

// DELETE /api/cylinders/:id — Delete cylinder
exports.deleteCylinder = async (req, res) => {
  try {
    const cylinder = await Cylinder.findByIdAndDelete(req.params.id);
    if (!cylinder) {
      return res.status(404).json({ message: 'Cylinder not found.' });
    }

    res.json({ message: 'Cylinder deleted successfully.' });
  } catch (error) {
    console.error('Delete cylinder error:', error);
    res.status(500).json({ message: 'Error deleting cylinder.' });
  }
};

// PUT /api/cylinders/:id/refill — Refill cylinder
exports.refillCylinder = async (req, res) => {
  try {
    const cylinder = await Cylinder.findById(req.params.id);
    if (!cylinder) {
      return res.status(404).json({ message: 'Cylinder not found.' });
    }

    const { installDate, capacity, dailyConsumptionRate } = req.body;

    // Log refill history
    cylinder.refillHistory.push({
      date: new Date(),
      capacity: cylinder.capacity,
      consumptionRate: cylinder.dailyConsumptionRate,
      performedBy: req.user ? req.user.name : 'System',
    });

    // Reset cylinder with new values
    cylinder.installDate = installDate ? new Date(installDate) : new Date();
    if (capacity) cylinder.capacity = capacity;
    if (dailyConsumptionRate) cylinder.dailyConsumptionRate = dailyConsumptionRate;
    cylinder.status = 'Active';

    await cylinder.save(); // Triggers recalculation
    broadcastCylinderUpdate(cylinder);

    res.json({ message: 'Cylinder refilled successfully.', cylinder });
  } catch (error) {
    console.error('Refill cylinder error:', error);
    res.status(500).json({ message: 'Error refilling cylinder.' });
  }
};

// GET /api/cylinders/depletion-summary — All cylinders sorted by urgency
exports.getDepletionSummary = async (req, res) => {
  try {
    let cylinders = await Cylinder.find({ status: { $ne: 'Inactive' } })
      .sort({ estimatedEmptyDate: 1 })
      .lean();

    const summary = cylinders.map((c) => {
      const daysRemaining = calculateDaysRemaining(c.estimatedEmptyDate);
      const percentage = calculatePercentageRemaining(c.installDate, c.estimatedEmptyDate);
      const urgencyInfo = getUrgencyLevel(percentage);
      return {
        _id: c._id,
        cylinderId: c.cylinderId,
        gasType: c.gasType,
        location: c.location,
        daysRemaining,
        percentageRemaining: percentage,
        estimatedEmptyDate: c.estimatedEmptyDate,
        urgency: urgencyInfo,
      };
    });

    const totalActive = summary.length;
    const critical = summary.filter((c) => c.urgency.level === 'critical' || c.urgency.level === 'expired');
    const soonestEmpty = summary[0] || null;

    res.json({
      totalActive,
      criticalCount: critical.length,
      soonestEmpty,
      top3Urgent: summary.slice(0, 3),
      all: summary,
    });
  } catch (error) {
    console.error('Depletion summary error:', error);
    res.status(500).json({ message: 'Error fetching depletion summary.' });
  }
};
