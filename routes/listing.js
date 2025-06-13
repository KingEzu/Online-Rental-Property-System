const router  = require('express').Router();
const verifyRoles = require('../middlewares/verify_roles');
const ROLES_LIST = require('../config/ROLES');
const listingController = require('../controllers/listing_controller');
const { verifyUserSession } = require('../middlewares/verify_user_session');

router.post('/create',verifyUserSession, verifyRoles(ROLES_LIST.LANDLORD),listingController.createListing);
router.delete('/remove/:id', verifyUserSession,verifyRoles(ROLES_LIST.LANDLORD, ROLES_LIST.ADMIN),listingController.removeListing);
router.put('/modify/:id', verifyUserSession,verifyRoles(ROLES_LIST.LANDLORD), listingController.modifyListing);
router.put('/setAvailable/:id', verifyUserSession,verifyRoles(ROLES_LIST.LANDLORD), listingController.setAvaliable);
router.put('/setUnAvailable/:id', verifyUserSession,verifyRoles(ROLES_LIST.LANDLORD), listingController.setUnAvaliable);
router.get('/page/:page',verifyUserSession,listingController.getPageListing );
router.get('/owner',verifyUserSession,verifyRoles(ROLES_LIST.LANDLORD), listingController.getOwnerListing);
router.get('/search/:page/:q',verifyUserSession,verifyRoles(ROLES_LIST.TENANT), listingController.getMatchingListing);
router.get('/get/:id',verifyUserSession,listingController.getListing);

module.exports = router;