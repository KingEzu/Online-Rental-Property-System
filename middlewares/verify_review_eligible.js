const sendErrorResponse = require('../utils/sendErrorResponse');
const agreementData = require('../data_access_module/agreement_data');

const verifyReviewEligible = async (req, res, next) => {
    try {
        const userId = req?.userId;
        if (!userId) return sendErrorResponse(res, 400, "Unauthorized!");
        const reservationCount = await agreementData.getAgreements(userId);
        if (reservationCount < 1) return sendErrorResponse(res, 403, "You need to have an accepted reservation to give reviews!");
        next();
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");
    }
}

module.exports = verifyReviewEligible;