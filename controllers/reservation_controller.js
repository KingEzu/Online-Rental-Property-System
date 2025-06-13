const reservationData = require('../data_access_module/reservation_data');
const notificationData = require('../data_access_module/notification_data');
const agreementData = require('../data_access_module/agreement_data');
const listingData = require('../data_access_module/listing_data');
const sendErrorResponse = require('../utils/sendErrorResponse');
const {getDate} = require('../utils/date');
const notificationTypes = require('../config/notification_types');

const requestReservation = async (req, res) =>{
    try {
        if( !req?.body?.owner_id ||
            !req?.body?.listing_id ||
            !req?.body?.selected_payment_method ||
            !req?.body?.tenant_name ||
            !req?.body?.additional_message ||
            !req?.body?.stay_dates 
        ) return sendErrorResponse(res,400,"Incomplete information!");
        const tenant_id = req?.userId;
        const {owner_id,listing_id, tenant_name,selected_payment_method, additional_message} = req?.body
        const price_offer = 0;
        const date = getDate();

        const stay_dates = typeof req?.body?.stay_dates === "string" ?JSON.parse(req?.body?.stay_dates) :
        typeof req?.body?.stay_dates === "object" ? Array.from(req?.body?.stay_dates) : [];

        if (!stay_dates) return sendErrorResponse(res, 400, "Incomplete information!");

        const reservationResult = await reservationData.createRequest({tenant_id,owner_id,tenant_name,listing_id,selected_payment_method,date,price_offer,stay_dates,additional_message});

        if (reservationResult.affectedRows < 1) return sendErrorResponse(res, 409, "Something went wrong!");

        const reservation_id = reservationResult.insertId;
        await notificationData.createNotification(
            tenant_id,
            owner_id,
            notificationTypes.EVENT,
            "New Reservation!",
            "Some one is interested in your listing!",
            getDate()
        );

        return res.status(200).json({
            success: true,
            message: "Successfully made a reservation request!",
            reservation_id: reservation_id
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const cancelReservation = async (req, res) =>{
    try {
        if( !req?.params?.id ) return sendErrorResponse(res,400,"Incomplete information!");
        
        const reservation_id = req?.params?.id;
        const tenant_id = req?.userId;
        const result = await reservationData.cancelReservation(tenant_id, reservation_id);

        if (result.affectedRows > 0) {
            return res.status(200).json({
                success : true,
                message : "successfully cancelled the reservaiton request!",
            });
        }
        return sendErrorResponse(res,500,"Internal server error, unable to cancel the reservaiton request!");
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const approveReservationRequest = async (req, res) =>{
    try {
        if( !req?.params?.id ){return sendErrorResponse(res,400,"Incomplete information!");}
        
        const reservation_id = req?.params?.id;
        const owner_id = req?.userId;
        const result = await reservationData.appoveReservation(owner_id, reservation_id);
        
        if (result.affectedRows < 1) {return sendErrorResponse(res,400,"Unable to update the property!");}
        
        const reservation = await reservationData.getReservation(owner_id, reservation_id);
        const listing = await listingData.getListing(reservation.listing_id);
        
        const agreement = {
            "tenant_id": reservation.tenant_id,
            "owner_id": owner_id,
            "listing_id": reservation.listing_id,
        };

        const lease_duration = listing.lease_duration_days;
        const check_in_date = reservation.stay_dates[0] ?? new Date().toISOString();

        await agreementData.createAgreement(agreement,lease_duration,check_in_date);
        await listingData.setUnAvailable(listing.listing_id);

        await notificationData.createNotification(
            owner_id,
            reservation.tenant_id,
            notificationTypes.APPROVE,
            "Reservation approved!",
            "Contact the owner for more details, you can use our app to make your payments.",
            getDate()
        );

        return res.status(200).json({
            success : true,
            message : "successfully approved the reservation request!",
        });

    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const declineReservationRequest = async (req, res) =>{
    try {
        if( !req?.params?.id ) return sendErrorResponse(res,400,"Incomplete information!");
        const reservation_id = req?.params?.id;
        const owner_id = req?.userId;
        const result = await reservationData.declineReservation(owner_id, reservation_id);
        if (result.affectedRows < 1) {return sendErrorResponse(res,400,"Unable to decline the reservation!");}
        const reservation = await reservationData.getReservation(owner_id, reservation_id);

        await notificationData.createNotification(
            reservation.tenant_id,
            owner_id,
            notificationTypes.DECLINE,
            "Reservation declined!",
            "Your reservation has been declined!",
            getDate()
        );

        return res.status(200).json({
            success : true,
            message : "Reservation declined!",
        });

    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const getReservations = async (req, res) => {
    try { 
        const owner_id = req?.userId;
        const result = await reservationData.getReservations(owner_id);
        return res.status(200).json({
            success : true,
            message : "Successfully loaded requests!",
            body : result
        });

    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const getTenantReservations = async (req, res) => {
    try {
        const tenant_id = req?.userId;
        const result = await reservationData.getReservations(tenant_id);        
        console.log(result);

        return res.status(200).json({
            success : true,
            message : "Successfully loaded your requests!",
            body : result
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const getAgreements = async (req, res) =>{
    try {
        const user_id = req?.params.id;
        if(!user_id) return sendErrorResponse(res,400,"Incomplete information!");

        const result = await agreementData.getAgreements(user_id);

        if(!result) return sendErrorResponse(res,404,"No agreements found!");

        return res.status(200).json({
            success : true,
            message : "Successfully loaded user's agreements!",
            body : result
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

module.exports = {
    getReservations,  
    approveReservationRequest,
    declineReservationRequest,
    requestReservation,
    cancelReservation,
    getTenantReservations,
    getAgreements
}