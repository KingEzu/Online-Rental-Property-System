const router = require('express').Router();
const accountController = require('../controllers/account_controller');
const verifyRegistrationRole = require('../middlewares/verify_registration_role');

router.post('/register', accountController.register);
router.post('/signin', accountController.signin);

module.exports = router;