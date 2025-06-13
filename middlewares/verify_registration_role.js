const sendErrorResponse = require('../utils/sendErrorResponse');

const verifyRegistrationRole = async (req, res, next) => {
    try {
        console.log(req?.body?.user_role);
        
        next();
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");
    }
}

module.exports = verifyRegistrationRole;