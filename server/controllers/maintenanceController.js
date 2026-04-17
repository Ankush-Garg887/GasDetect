const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const SafetyChecklist = require('../models/SafetyChecklist');

// GET /api/maintenance/schedules
exports.getSchedules = async (req, res) => {
  try {
    const { completed, cylinderId } = req.query;
    const query = {};
    if (completed !== undefined) query.completed = completed === 'true';
    if (cylinderId) query.cylinderId = cylinderId;

    const schedules = await MaintenanceSchedule.find(query)
      .sort({ nextInspectionDate: 1 })
      .lean();

    res.json(schedules);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Error fetching schedules.' });
  }
};

// POST /api/maintenance/schedules
exports.createSchedule = async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.create({
      ...req.body,
      createdBy: req.user.name,
    });
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Error creating schedule.' });
  }
};

// PUT /api/maintenance/schedules/:id
exports.updateSchedule = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.completed) {
      updates.completedAt = new Date();
      updates.completedBy = req.user.name;
    }

    const schedule = await MaintenanceSchedule.findByIdAndUpdate(
      req.params.id, updates, { new: true }
    );

    if (!schedule) return res.status(404).json({ message: 'Schedule not found.' });
    res.json(schedule);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Error updating schedule.' });
  }
};

// DELETE /api/maintenance/schedules/:id
exports.deleteSchedule = async (req, res) => {
  try {
    await MaintenanceSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted.' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Error deleting schedule.' });
  }
};

// POST /api/maintenance/checklists
exports.submitChecklist = async (req, res) => {
  try {
    const checklist = await SafetyChecklist.create({
      ...req.body,
      submittedBy: req.user.name,
    });
    res.status(201).json(checklist);
  } catch (error) {
    console.error('Submit checklist error:', error);
    res.status(500).json({ message: 'Error submitting checklist.' });
  }
};

// GET /api/maintenance/checklists
exports.getChecklists = async (req, res) => {
  try {
    const { limit } = req.query;
    const checklists = await SafetyChecklist.find()
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();
    res.json(checklists);
  } catch (error) {
    console.error('Get checklists error:', error);
    res.status(500).json({ message: 'Error fetching checklists.' });
  }
};
