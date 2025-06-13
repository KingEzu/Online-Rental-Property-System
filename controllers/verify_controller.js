const { getVerificationKey, createVerificationKey} = require('../data_access_module/verification_data');
const {changeUserStatus, getUser} =  require('../data_access_module/user_data');
const sendErrorResponse = require('../utils/sendErrorResponse');
const sendCodeToEmail = require('../utils/emailer');
const ACTIVE_STATUS = require('../config/verify_status');
const crypto = require('crypto');

const verify_post = async (req, res)  => {
    const {key} = req?.params;
    const userId = req?.userId;
    if(!key || !userId){
        return sendErrorResponse(res, 400, 'Invalid information!');
    }
    const retrievedKey = await getVerificationKey(key);
    if (!retrievedKey[0]) {
        return sendErrorResponse(res, 400, 'Invalid information!');
    }

    if (parseInt(retrievedKey[0].expires_at) < (new Date().getTime())) {
        return sendErrorResponse(res, 408, 'Time is up try again!');
    }

    const vKeyMatches = retrievedKey[0].verification_key === parseInt(key);

    if (!vKeyMatches) {
        return sendErrorResponse(res, 400, 'Verification failed!');
    }

    try {
        const result = await changeUserStatus(userId ,ACTIVE_STATUS.ACTIVE);
        if (result.affectedRows > 0) {
            return res.status(200).json({
                success : true,
                message : 'Registration successful!',
            });
        }else{
            return sendErrorResponse (res, 500, 'Internal error try again!');  
        }
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, 'Internal error please try agin later.');
    }
}

const verify_get = async (req, res)  => {
    try {
        const userId = req?.userId;
        if (!userId) return sendErrorResponse(res, 401, 'Unauthorized');
        const userData = await getUser(userId);
        const {email} = userData;

        const randomCode  = crypto.randomInt(999999);
        sendCodeToEmail(email,randomCode, async () =>{
            
        });
        await createVerificationKey(
            userId,
            randomCode,
            ""+new Date().getTime(),
            ""+(new Date().getTime() + 60000 * 5));

        return res.status(200).json({
            success : true,
            message : 'Verification code sent to ' + email,
        });

    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, 'Internal server error!');
    }

}

module.exports = {verify_post, verify_get}