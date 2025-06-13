const router  = require('express').Router();
const verifyRoles = require('../middlewares/verify_roles');
const ROLES_LIST = require('../config/ROLES');
const paymentController = require('../controllers/payment_controller');
const paymentData = require('../data_access_module/payment_data');
const { verifyUserSession } = require('../middlewares/verify_user_session');
const verifyActive = require('../middlewares/verify_active');

router.get('/getSubAccount/:id',verifyUserSession,verifyActive,verifyRoles(ROLES_LIST.TENANT,ROLES_LIST.LANDLORD),paymentController.getPaymentInfo);
router.get('/myInfo',verifyUserSession,verifyActive,verifyRoles(ROLES_LIST.LANDLORD),paymentController.getMyPaymentInfo);
router.post('/createSubAccount',verifyUserSession,verifyActive,verifyRoles(ROLES_LIST.LANDLORD),paymentController.createSubAccount);
router.delete('/deleteSubAccount',verifyUserSession,verifyActive,verifyRoles(ROLES_LIST.LANDLORD),paymentController.deleteSubAccount);
router.post('/initialize', verifyUserSession,verifyActive,verifyRoles(ROLES_LIST.TENANT),paymentController.initialize);
router.get('/verify/:txref',paymentController.verifyPayment);

router.get('/getAllReferences',verifyUserSession,verifyRoles(ROLES_LIST.ADMIN), async (req, res) => {
    const allData = await paymentData.getAllPaymentReferences();
    res.json(allData);
});

module.exports = router;