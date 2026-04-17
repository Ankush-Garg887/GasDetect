const router = require('express').Router();
const {
  getSchedules, createSchedule, updateSchedule, deleteSchedule,
  submitChecklist, getChecklists,
} = require('../controllers/maintenanceController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);
router.put('/schedules/:id', updateSchedule);
router.delete('/schedules/:id', deleteSchedule);

router.get('/checklists', getChecklists);
router.post('/checklists', submitChecklist);

module.exports = router;
