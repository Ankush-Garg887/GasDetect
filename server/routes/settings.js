const router = require('express').Router();
const { getSettings, updateSettings, updateProfile } = require('../controllers/settingsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getSettings);
router.put('/', updateSettings);
router.put('/profile', updateProfile);

module.exports = router;
