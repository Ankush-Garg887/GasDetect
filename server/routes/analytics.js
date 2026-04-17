const router = require('express').Router();
const { getGasAnalytics, getCylinderAnalytics, exportData } = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/gas', getGasAnalytics);
router.get('/cylinders', getCylinderAnalytics);
router.get('/export', exportData);

module.exports = router;
