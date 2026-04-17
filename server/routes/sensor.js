const router = require('express').Router();
const { postSensorData, getLatestReading, getHistory, getSystemLogs } = require('../controllers/sensorController');
const auth = require('../middleware/auth');

// NodeMCU posts here — no auth required for device
router.post('/data', postSensorData);

// Dashboard & history — auth required
router.get('/latest', auth, getLatestReading);
router.get('/history', auth, getHistory);
router.get('/logs', auth, getSystemLogs);

module.exports = router;
