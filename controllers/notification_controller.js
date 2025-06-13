const notificationData = require('../data_access_module/notification_data');
const sendErrorResponse = require('../utils/sendErrorResponse');

const getUserNotifications = async (req, res) => {
    try {
        if( !req?.userId ) return sendErrorResponse(res,400,"Incomplete information!");
        const userId = req?.userId;
        const notificationResult = await notificationData.getNotifications(userId);
        return res.status(200).json({
            success: true,
            message: "Successfully loaded notifications!",
            body: notificationResult
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const getNotificationCount = async (req, res) => {
    try {
        if( !req?.userId ) return sendErrorResponse(res,400,"Incomplete information!");
        const userId = req?.userId;
        const notificationCount = await notificationData.getNotificationCount(userId);
        return res.status(200).json({
            success: true,
            message: "Successfully loaded notification count!",
            body: notificationCount[0]
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

module.exports = {
    getUserNotifications,
    getNotificationCount
}