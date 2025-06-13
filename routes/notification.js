const router  = require('express').Router();
const ROLES_LIST = require('../config/ROLES');
const notificationController = require('../controllers/notification_controller');
const verifyRoles = require('../middlewares/verify_roles');
const { verifyUserSession } = require('../middlewares/verify_user_session');

router.get('/get',verifyUserSession, verifyRoles(ROLES_LIST.LANDLORD, ROLES_LIST.TENANT),notificationController.getUserNotifications);
router.get('/count',verifyUserSession, verifyRoles(ROLES_LIST.LANDLORD, ROLES_LIST.TENANT),notificationController.getNotificationCount);

module.exports = router;