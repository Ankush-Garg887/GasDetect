const Settings = require('../models/Settings');

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = await Settings.create({ userId: req.user.id });
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Error fetching settings.' });
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const allowedFields = [
      'refreshInterval', 'sensorType', 'thresholds',
      'mqttBroker', 'apiEndpoint', 'darkMode', 'soundEnabled',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    updates.updatedAt = new Date();

    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      updates,
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Error updating settings.' });
  }
};

// PUT /api/settings/profile — Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('+password');

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile.' });
  }
};
