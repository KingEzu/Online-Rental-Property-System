const sendErrorResponse = require('../utils/sendErrorResponse');

const verifyRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req?.userRole) return sendErrorResponse(res, 401, "Unauthorized!");

        const rolesArray = [...allowedRoles];
        const uRole = !Array.isArray(req.userRole) ? [req.userRole] : req.userRole;
        const result = uRole.map(userRole => rolesArray.includes(userRole)).find(val => val === true);
        if (!result) return sendErrorResponse(res, 403, "Forbidden!");
        next();
    }
}

module.exports = verifyRoles