const router  = require('express').Router();
const ROLES_LIST = require('../config/ROLES');
const userController = require('../controllers/user_controller');
const verifyRoles = require('../middlewares/verify_roles');
const { verifyUserSession } = require('../middlewares/verify_user_session');

router.delete('/remove/:id', verifyUserSession,verifyRoles(ROLES_LIST.ADMIN),userController.removeUser);
router.get('/page/:page',verifyUserSession,verifyRoles(ROLES_LIST.ADMIN),userController.getAllUsers );
router.put('/suspend/:id',verifyUserSession,verifyRoles(ROLES_LIST.ADMIN),userController.suspendUser );
router.put('/activate/:id',verifyUserSession,verifyRoles(ROLES_LIST.ADMIN),userController.activateUser );
router.get('/get/:id', verifyUserSession,userController.getUser);


module.exports = router;