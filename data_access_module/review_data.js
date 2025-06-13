require('dotenv').config();
const pool = require('../config/db');

const createReview = async (review) =>{
    const connection = await pool.getConnection();
  try {
    const {author_id,review_message,reviewed_listing_id,author_name,rating,receiver_id} = review;
    const [result] = await connection.execute(`INSERT INTO reviews(author_id,reviewed_listing_id,receiver_id,review_message,rating,author_name)
    VALUES(?,?,?,?,?,?);`,[author_id,reviewed_listing_id ?? 0,receiver_id,review_message,rating,author_name]);
    return result;
  } catch (error) {
    throw error;
  }finally{
    connection.release();
  }
}

const deleteReview = async (user_id, review_id) =>{
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.
        execute(`DELETE FROM reviews WHERE author_id = ? AND review_id = ?;`,[user_id, review_id]);
        return result;
    } catch (error) {
        throw error;
    }finally{
        connection.release();
    }
}

const getListingReviews  = async (listing_id) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM reviews WHERE reviewed_listing_id = ?;',
        [listing_id]);
        return rows;
    } catch (error) {
        throw error;
    }finally{
        connection.release();
    }
}

const getUserReviews  = async (user_id) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`SELECT 
    reviews.*,
    user.full_name,
    COALESCE(
        (SELECT user_photos.url 
         FROM user_photos 
         WHERE reviews.author_id = user_photos.user_id 
         LIMIT 1), 
        '') AS photo_url FROM 
    reviews LEFT JOIN 
    user ON reviews.author_id = user.user_id WHERE 
    reviews.receiver_id = ? GROUP BY reviews.review_id;`,
        [user_id]);
        return rows;
    } catch (error) {
        throw error;
    }finally{
        connection.release();
    }
}

module.exports = {
    createReview,
    deleteReview,
    getListingReviews,
    getUserReviews
};