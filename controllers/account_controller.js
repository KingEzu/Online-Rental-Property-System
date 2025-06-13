const userData = require('../data_access_module/user_data');
const sessionData = require('../data_access_module/session_data');
const agreementData = require('../data_access_module/agreement_data');
const { createVerificationKey, getVerificationKey } = require('../data_access_module/verification_data');
const { handleFileUpload, uploadPhoto } = require('../data_access_module/upload_data');
const { getUserByEmail } = require('../data_access_module/user_data');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sendErrorResponse = require('../utils/sendErrorResponse');
const sendCodeToEmail = require('../utils/emailer');
const signout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.session_id && !req?.userId) return res.sendStatus(204); //No content
    const cookieSessionId = cookies.session_id;
    const result = await sessionData.deleteUserSession(cookieSessionId);
    if (result.affectedRows < 1) return sendErrorResponse(res, 409, "Unable to logout!");
    res.clearCookie('session_id', { httpOnly: true, sameSite: 'None', secure: true });
    res.status(200).json({
        success: true,
        message: "Logged out successfully!",
    }
  );
}

const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return sendErrorResponse(res, 400, "Please provide email and password!");
        const foundUser = await getUserByEmail(email);
        if (!foundUser  || !foundUser.user_role) return sendErrorResponse(res, 400, "User not found!");
        const match = await bcrypt.compare(password, foundUser.auth_string);
        if (!match) return sendErrorResponse(res, 400, 'Password is invalid!');
        const sessionId = crypto.randomBytes(64).toString('hex');
        const userId = foundUser?.user_id;
        const userRole = foundUser?.user_role;
        const userAgent = req.headers['user-agent'];
        const origin = req.headers.origin || "UNDEFINED";
        const createdAt = "" + new Date().getTime();
        const dayMillSec = 1000 * 60 * 60 * 24;
        const expiresAt = "" + (new Date().getTime() + dayMillSec);

        const result = await sessionData.createUserSession(sessionId,userId,userRole,userAgent,origin,createdAt,expiresAt);
        if (result.affectedRows < 1) return sendErrorResponse(res, 409, 'Something went wrong!');
        if (req?.cookies?.session_id) await handleExsistingSession(req?.cookies?.session_id);
        res.cookie('session_id', sessionId, { httpOnly: true, secure: true, sameSite: 'None', maxAge: (24 * 60 * 60 * 1000) });
        res.status(200).json({
            success : true,
            message : 'Login success',
            body : foundUser
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");   
    }
}


const restoreAccount = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email ) return sendErrorResponse(res, 400, "Please provide email!");
        const foundUser = await getUserByEmail(email);
        if (!foundUser  || !foundUser.user_role) return sendErrorResponse(res, 400, "User not found!");
        const randomCode = crypto.randomInt(999999);
        
        await sendVerificationCode(res, email, randomCode);
        
        await createVerificationKey(
            foundUser.user_id,
            randomCode,
            "" + new Date().getTime(),
            "" + (new Date().getTime() + 60000 * 5)
        );

        res.status(200).json({
            success : true,
            message : 'Verification Sent!',
            body : foundUser
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");   
    }
}

const restoreAccountVerify = async (req, res) =>{
    const {key} = req?.params;
    if(!key){
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
        return sendErrorResponse(res, 400, `Keys don't match!`);
    }

    const sessionId = crypto.randomBytes(64).toString('hex');

    res.cookie('session_id', sessionId, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'None', 
        maxAge: (24 * 60 * 60 * 1000) 
    });

    res.status(200).json({
        success : true,
        message : 'Please update your password!'
    });
}

const restoreAccountPassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { password1, password2 } = req.body;

        if (!password1 || !password2 || password1 != password2) return sendErrorResponse(res, 400, "Please valid and strong password!");
    
        bcrypt.hash(password1, 8, async (err, hash) => {
            const auth_string = hash;
            const userAuthRes = await userData.changeUserAuthString(userId, auth_string);
            if(userAuthRes.affectedRows < 1){
                return sendErrorResponse(res, 500, 'Restore account failed try agin later!');
            }
        });

        res.status(200).json({
            success : true,
            message : 'Update successful!'
        });

    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");   
    }
}

const changePassword = async (req, res) => {
    try {
        const { oldPassword, password1, password2 } = req.body;
        const userId = req.userId;

        if (!oldPassword || !password1 || !password2 || password1 != password2){
            return sendErrorResponse(res, 400, "Please valid and strong password!");
        } 

        const foundUser = await userData.getUser(userId);
        
        if (!foundUser  || !foundUser.user_role) return sendErrorResponse(res, 400, "User not found!");

        const foundUserAuth = await userData.getUserByEmail(foundUser.email);

        const match = await bcrypt.compare(oldPassword, foundUserAuth.auth_string);

        if (!match) return sendErrorResponse(res, 400, 'Password is invalid!');
        
        bcrypt.hash(password1, 8, async (err, hash) => {
            const auth_string = hash;
            const userAuthRes = await userData.changeUserAuthString(foundUser.user_id, auth_string);
            if(userAuthRes.affectedRows < 1){
                return sendErrorResponse(res, 500, 'Password update failed!');
            }
        });

        res.status(200).json({
            success : true,
            message : 'Password update successful!',
            body : foundUser
        });

    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");   
    }
}

const handleExsistingSession  = async (sessionId) =>{
    const foundSession = await sessionData.getUserSession(sessionId);
    if (foundSession[0]) {
        await sessionData.deleteUserSession(sessionId);
    }
}

const register = async (req, res) => {
    try{
        handleFileUpload(req, res, async (err) => {            
            const profileImage = Array.from(req?.files ?? []).find((e) => e.originalname == "user_profile_image");
            const idImage = Array.from(req?.files ?? []).find((e) => e.originalname == "user_id_image");
            if (    
                !req?.body?.full_name ||
                !req?.body?.gender ||
                !req?.body?.phone_number ||
                !req?.body?.date_of_birth ||
                !req?.body?.email ||
                !req?.body?.zone ||
                !req?.body?.woreda ||
                !req?.body?.job_type ||
                !req?.body?.user_role ||
                !req?.body?.region ||
                !req?.body?.id_type ||
                !req?.body?.id_number ||
                !req?.body?.password || 
                !idImage
            ) {
                return sendErrorResponse(res, 400, 'Please provide the required information!');
            }
            if (req?.body?.user_role == 3000 || (req?.body?.user_role != 1000 && req?.body?.user_role != 2000)) return sendErrorResponse(res, 403, "Forbidden");
            const { full_name,date_of_birth,gender,phone_number,email,zone,woreda,job_type, id_type, id_number, region,password,user_role } = req?.body;
            const married = req?.body?.married ? 1 : 0;
            const account_status = 2000;
            const foundUser = await getUserByEmail(email);
            if (foundUser) return sendErrorResponse(res, 409, 'User already exists with this email!');
            var uploaded_file;
            if(err) return sendErrorResponse(res, 400, "Photos Only jpeg | png type & upto 1 MB is allowed!");
            if (profileImage) {
                try{		
                    uploaded_file = await uploadPhoto(profileImage);
                } catch (error) {
                    console.log(error);
                    return sendErrorResponse(res, 500, "Internal server error! Couldn't upload the file!");    
                }   
                if (!uploaded_file) return sendErrorResponse(res, 500, "Internal server error! Couldn't upload the file!");
            }

            var id_photo_url;
            if (idImage) {
                try{
                    id_photo_url = await uploadPhoto(idImage);
                } catch (error) {
                    console.log(error);
                    return sendErrorResponse(res, 500, "Internal server error! Couldn't upload the file!");    
                }   
                if (!id_photo_url) return sendErrorResponse(res, 500, "Internal server error! Couldn't upload the file!");
            }

            const userRegRes = await userData.createUser({ 
                full_name,gender,phone_number,email,zone,user_role,woreda,job_type,
                id_photo_url, id_type, id_number, uploaded_file, date_of_birth, account_status,region,married 
              }, 
              [], 
              uploaded_file
            );

            if (userRegRes.affectedRows < 1) return sendErrorResponse(res, 500, 'Something went wrong!');
	        const new_user_id = userRegRes.insertId;
            
            bcrypt.hash(password, 8, async (err, hash) => {
                const auth_string = hash;
                const userAuthRes = await userData.createUserAuth(new_user_id, auth_string, user_role);
                if(userRegRes.affectedRows < 1 || userAuthRes.affectedRows < 1) {
                    return sendErrorResponse(res, 500, 'Registration failed try agin later!');
                }
            });

            const sessionId = crypto.randomBytes(64).toString('hex');
            const userRole = user_role;

            const userAgent = req.headers['user-agent'];
            const origin = req.headers.origin || "UNDEFINED";
            const createdAt = "" + new Date().getTime();
            const dayMillSec = 1000 * 60 * 60 * 24;
            const expiresAt = "" + (new Date().getTime() + dayMillSec);
            
            const sessionResult = await sessionData.createUserSession(
                sessionId,
                new_user_id,
                userRole,
                userAgent,
                origin,
                createdAt,
                expiresAt
            );
            
            if (sessionResult.affectedRows < 1) return sendErrorResponse(res, 409, 'Something went wrong!');

            if (req?.cookies?.session_id) await handleExsistingSession(req?.cookies?.session_id);

            res.cookie('session_id', sessionId, { httpOnly: true, secure: true, sameSite: 'None', maxAge: (24 * 60 * 60 * 1000) });

            const randomCode = crypto.randomInt(999999);

            await sendVerificationCode(res, email, randomCode);

            await createVerificationKey(
                new_user_id,
                randomCode,
                ""+new Date().getTime(),
                ""+(new Date().getTime() + 60000 * 5));

            return res.status(200).json({
                success : true,
                message : 'Please verify your email!',
            });
        });

    }catch(error){
        console.log(error);
        return sendErrorResponse (res, 500, 'Internal error try again!');
    }
}

const modifyProfile = async (req, res) => {
    try{
        const userId = req.userId;
        handleFileUpload(req, res, async (err) => {
            if (
                !req?.body?.full_name ||
                !req?.body?.phone_number ||
                !req?.body?.zone ||
                !req?.body?.woreda ||
                !req?.body?.job_type ||
                !req?.body?.date_of_birth ||
                !req?.body?.region
            ) {
                return sendErrorResponse(res, 400, 'Please provide the required information!');             
            }

            const { 
                full_name,
                phone_number,
                zone,
                woreda,
                job_type,
                date_of_birth,
                region,
                married 
            } = req?.body;
	    
            var uploaded_file;
            if(err) return sendErrorResponse(res, 400, "Photos Only jpeg | png type & upto 1 MB is allowed!");

            if (req?.files.length > 0) {
                try{
                    uploaded_file = await uploadPhoto(req?.files[0]);
                } catch (error) {
                    console.log(error);
                    return sendErrorResponse(res, 500, "Internal server error! Couldn't upload the file!");    
                }   
                if (!uploaded_file) return sendErrorResponse(res, 500, "Internal server error! Couldn't upload the file!");
                
            }

            const m = married === "Married" ? 1 : 0;
            
            const userRegRes = await userData.updateUser(
                userId ,{ 
                    full_name,
                    phone_number,
                    zone,
                    woreda,
                    job_type,
                    date_of_birth,
                    region,
                    "married" : m
                },
                uploaded_file
            );

            if (userRegRes.affectedRows < 1) return sendErrorResponse(res, 500, 'Something went wrong!');
            const updateProfile = await userData.getUser(userId);
            return res.status(200).json({
                success : true,
                message : 'Account Updated!',
                updatedUser : updateProfile
            });
        });

    }catch(error){
        console.log(error);
        return sendErrorResponse (res, 500, 'Internal error try again!');
    }
}

const sendVerificationCode = async (res, email, randomCode) =>{
    try {
        sendCodeToEmail(email,randomCode, () =>{

        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse (res, 400, 'Your email is invalid!');
    }
}

const getUserAgreements = async (req, res) =>{
    try {
        const user_id = req.params.id;
        if(!user_id) return sendErrorResponse(res, 400, "Incomplete information!");

        const agreements = await agreementData.getAgreements(user_id);
        return res.status(200).json({
            "success" : true,
            "message": "Loading user's agreements!",
            body : agreements
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");
    }
}

const getMyAgreements = async (req, res) =>{
    try {
        const user_id = req.userId;
        if(!user_id) return sendErrorResponse(res, 400, "Incomplete information!");

        const agreements = await agreementData.getAgreements(user_id);
        return res.status(200).json({
            "success" : true,
            "message": "Loading your agreements!",
            body : agreements
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, 500, "Internal server error!");
    }
}



module.exports = {
    signin,
    signout,
    register,
    getUserAgreements,
    getMyAgreements,
    restoreAccount,
    restoreAccountVerify,
    restoreAccountPassword,
    changePassword,
    modifyProfile
}