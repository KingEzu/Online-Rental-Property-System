const router = require('express').Router();
const verifyController = require('../controllers/verify_controller');
const accountController = require('../controllers/account_controller');
const { verifyUserSession } = require('../middlewares/verify_user_session');

router.post('/restore',accountController.restoreAccount);
router.post('/restoreAccountVerify/:key',accountController.restoreAccountVerify);
router.put('/restorePassword', accountController.restoreAccountPassword);

router.put('/updatePassword', verifyUserSession, accountController.changePassword);
router.put('/modify', verifyUserSession, accountController.modifyProfile);

router.get('/signout', verifyUserSession,accountController.signout);
router.post('/verify/:key', verifyController.verify_post);
router.get('/agreement/:id', verifyUserSession,accountController.getUserAgreements);
router.get('/myAgreement', verifyUserSession,accountController.getMyAgreements);
router.get('/verify', verifyUserSession,verifyController.verify_get);

module.exports = router;