const { getUserSession, deleteUserSession } = require('../data_access_module/session_data');
const verifyAdminSession = async (req, res, next) => {    
    try {
        const cookies = req?.cookies;
        if (!cookies?.session_id){
            res.redirect('/admin/signin');
            return;
        } 
        const cookieSessionId = cookies.session_id;
        const userSession = await getUserSession(cookieSessionId);
        const foundUserSession = userSession[0];

        if (!foundUserSession) {
            res.clearCookie("session_id");
            res.redirect('/admin/signin');
            return;
        } 

        const expiresAt = parseInt(foundUserSession.expires_at);
        const timeNow = new Date().getTime();
        const session_expired = timeNow >= expiresAt;

        if (session_expired) {
            await deleteUserSession(foundUserSession.session_id);
            res.clearCookie("session_id");
            res.redirect('/admin/signin');
            return;
        }

        req.userId = foundUserSession.user_id;
        req.userRole = foundUserSession.user_role;
        
        next();
    } catch (error) {
        console.log(error);
        res.redirect('/admin/signin');
        return;
    }
};

module.exports = {verifyAdminSession};
