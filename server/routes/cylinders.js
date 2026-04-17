const router = require('express').Router();
const {
  createCylinder, getCylinders, getCylinder,
  updateCylinder, deleteCylinder, refillCylinder,
  getDepletionSummary,
} = require('../controllers/cylinderController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.use(auth); // All routes require auth

router.get('/depletion-summary', getDepletionSummary);
router.get('/', getCylinders);
router.get('/:id', getCylinder);
router.post('/', roleGuard('admin'), createCylinder);
router.put('/:id', roleGuard('admin'), updateCylinder);
router.delete('/:id', roleGuard('admin'), deleteCylinder);
router.put('/:id/refill', roleGuard('admin'), refillCylinder);

module.exports = router;
