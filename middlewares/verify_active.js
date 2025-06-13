const {getUserStatus} = require('../data_access_module/user_data');
const sendErrorResponse = require('../utils/sendErrorResponse');

const verifyActive = async (req, res, next) => {
    try {
        if (!req?.userId) return sendErrorResponse(
            res, 
            401, 
            "Unauthorized!"
        );        
        const userId = req?.userId;
        const result = await getUserStatus(userId);

        if (!result[0]) return sendErrorResponse(
            res, 
            500, 
            "Internal server error!"
        );
        switch (result[0].account_status) {
            case 1000:
                return sendErrorResponse(
                    res, 
                    403, 
                    "Please verify your acccount!"
                );
            case 2000:
                return sendErrorResponse(
                    res, 
                    403, 
                    "Your account has been suspended!"
                );
            case 3000:
                next();
            break;
            default:
                return sendErrorResponse(
                    res, 
                    403, 
                    "Forbidden!"
                );
            break;
        }
    } catch (error) {
        console.log(error);
        return sendErrorResponse(
            res, 
            500, 
            "Internal server error!"
        );
    }
}

module.exports = verifyActive