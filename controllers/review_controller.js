const {getDate} = require('../utils/date');
const reviewData = require('../data_access_module/review_data');
const { getUser } = require('../data_access_module/user_data');
const sendErrorResponse = require('../utils/sendErrorResponse');

const deleteReview = async (req, res) => {
    try {
        if( !req?.userId || !req?.params?.id ) return sendErrorResponse(res,400,"Incomplete information!");

        const author_id = req?.userId;
        const review_id = req?.params?.id;
        const reviewResult = await reviewData.deleteReview(author_id, review_id);
        
        if (reviewResult.affectedRows < 1) return sendErrorResponse(res,500,"Internal server error!, could not delete the review!"); 

        return res.status(200).json({
            success: true,
            message: "Successfully deleted the review!",
        });

    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const getUserReviews = async (req, res) => {
    try {
        if( !req?.params?.id ){
            return sendErrorResponse(res,400,"Incomplete information!");
        }
        const user_id = req?.params?.id;


        const reviewResult = await reviewData.getUserReviews(user_id);
        return res.status(200).json({
            success: true,
            message: "Successfully loaded Reviews!",
            body: reviewResult
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const getMyReviews = async (req, res) => {
    try {
        if( !req?.userId ) return sendErrorResponse(res,400,"Incomplete information!");
        const user_id = req?.userId;
        const reviewResult = await reviewData.getUserReviews(user_id);

        return res.status(200).json({
            success: true,
            message: "Successfully loaded Reviews!",
            body: reviewResult
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const getListingReviews = async (req, res) => {
    try {
        if( !req?.params?.id ) return sendErrorResponse(res,400,"Incomplete information!");
        const listing_id = req?.params?.id;
        const reviewResult = await reviewData.getListingReviews(listing_id);

        return res.status(200).json({
            success: true,
            message: "Successfully loaded Reviews!",
            body: reviewResult
        });
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

const createReview = async (req, res) =>{
    try {

        if( !req?.body?.review_message ||
            !req?.body?.rating ||
            !req?.body?.receiver_id ||
            !req?.body?.author_name
         ) return sendErrorResponse(res,400,"Incomplete information!");

        const author_id = req?.userId;
        const {review_message,rating,reviewed_listing_id,author_name,receiver_id} = req?.body;

        const userToReview = await getUser(receiver_id);
        if(userToReview.user_id == author_id) return sendErrorResponse(res, 403, "you can not review your account!");

        const reviewResult = await reviewData.createReview({
            author_id,review_message,rating,author_name,receiver_id,reviewed_listing_id
        });

        if (reviewResult.affectedRows < 1) return sendErrorResponse(res, 409, "Something went wrong!");
        
        return res.status(200).json({
            success: true,
            message: "Review successfully sent!"
        });

    } catch (error) {
        console.log(error);
        return sendErrorResponse(res,500,"Internal server error!");
    }
}

module.exports = {
    deleteReview,
    getUserReviews,
    createReview,
    getMyReviews,
    getListingReviews
}