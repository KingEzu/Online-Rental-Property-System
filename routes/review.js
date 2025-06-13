const router  = require('express').Router();
const verifyRoles = require('../middlewares/verify_roles');
const ROLES_LIST = require('../config/ROLES');
const reviewController = require('../controllers/review_controller');
const { verifyUserSession } = require('../middlewares/verify_user_session');
const verifyReviewEligible = require('../middlewares/verify_review_eligible');

router.get('/user/:id',verifyUserSession, verifyRoles(ROLES_LIST.LANDLORD, ROLES_LIST.TENANT),reviewController.getUserReviews);
router.get('/listing/:id',verifyUserSession, verifyRoles(ROLES_LIST.LANDLORD, ROLES_LIST.TENANT),reviewController.getListingReviews);
router.delete('/delete/:id',verifyUserSession, verifyRoles(ROLES_LIST.LANDLORD, ROLES_LIST.TENANT),reviewController.deleteReview);
router.post('/create',verifyUserSession, verifyRoles(ROLES_LIST.LANDLORD, ROLES_LIST.TENANT), verifyReviewEligible,reviewController.createReview);
router.get('/myreviews',verifyUserSession, verifyRoles(ROLES_LIST.LANDLORD, ROLES_LIST.TENANT),reviewController.getMyReviews);

module.exports = router;