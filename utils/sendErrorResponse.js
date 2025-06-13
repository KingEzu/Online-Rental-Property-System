function sendErrorResponse(res, status, message) {
    res.status(status).json({
        success: false,
        message: message,
    });
}

module.exports = sendErrorResponse;