const router  = require('express').Router();
const ROLES_LIST = require('../config/ROLES');
const reservationController = require('../controllers/reservation_controller');
const verifyRoles = require('../middlewares/verify_roles');
const { verifyUserSession } = require('../middlewares/verify_user_session');
const { getReservationsReports } = require('../data_access_module/reservation_data');

router.get('/get',verifyUserSession, verifyRoles(ROLES_LIST.LANDLORD),reservationController.getReservations);
router.get('/myRequests',verifyUserSession, verifyRoles(ROLES_LIST.TENANT),reservationController.getTenantReservations);
router.put('/approve/:id',verifyUserSession,verifyRoles(ROLES_LIST.LANDLORD), reservationController.approveReservationRequest);
router.put('/decline/:id', verifyUserSession,verifyRoles(ROLES_LIST.LANDLORD),reservationController.declineReservationRequest);
router.post('/request',verifyUserSession, verifyRoles(ROLES_LIST.TENANT),reservationController.requestReservation);
router.get('/agreements/:id',verifyUserSession, verifyRoles(ROLES_LIST.TENANT, ROLES_LIST.LANDLORD),reservationController.getAgreements);
router.get('/reservationReport',verifyUserSession, verifyRoles(ROLES_LIST.ADMIN), async (req, res) =>{
    const data = await getReservationsReports();
    res.status(200).json(data);
});
router.delete('/cancel/:id',verifyUserSession, verifyRoles(ROLES_LIST.TENANT),reservationController.cancelReservation);

module.exports = router;