const router = require('express').Router();
const { getAlerts, acknowledgeAlert, getAlertStats } = require('../controllers/alertController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getAlerts);
router.get('/stats', getAlertStats);
router.put('/:id/ack', acknowledgeAlert);

module.exports = router;
