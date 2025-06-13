require('dotenv').config();
const pool = require('../config/db');

const createNotification = async (initiator_id,receiver_id,type,title,body) =>{
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(
        `INSERT INTO notification(initiator_id,receiver_id,type,title,body)VALUES(?,?,?,?,?)`,
        [initiator_id,receiver_id,type,title,body]);
        return result;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    } 
}

const getNotifications = async (user_id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
    `SELECT 
    notification.*, 
    JSON_OBJECT(
        'user_id', user.user_id,
        'full_name', user.full_name,
        'gender', user.gender,
        'phone_number', user.phone_number,
        'date_of_birth', user.date_of_birth,
        'email', user.email,
        'zone', user.zone,
        'woreda', user.woreda,
        'date_joined', user.date_joined,
        'account_status', user.account_status,
        'region', user.region,
        'job_type', user.job_type,
        'married', user.married,
        "id_photo_url", user.id_photo_url,
        "id_type", user.id_type,
        "id_number", user.id_number,
        'photo_url', COALESCE(
            (SELECT user_photos.url 
             FROM user_photos 
             WHERE user.user_id = user_photos.user_id 
             LIMIT 1), 
            JSON_ARRAY()
        ),
        'contact_infos', COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'contact_name', contact_info.contact_name, 
                    'contact_address', contact_info.contact_address
                )
            ), 
            JSON_ARRAY()
        )
    ) AS initiator FROM notification 
    LEFT JOIN user ON notification.initiator_id = user.user_id 
    LEFT JOIN contact_info ON user.user_id = contact_info.user_id 
    WHERE notification.receiver_id = ? GROUP BY notification.notification_id, user.user_id;`,[user_id]);

    await connection.execute(`UPDATE notification SET viewed = TRUE WHERE receiver_id = ?;`,[user_id]);
    return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }  
}

const getNotificationCount = async (user_id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT COUNT(*) AS unseen_count FROM notification 
            WHERE viewed = 0 AND receiver_id = ?;`,[user_id]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }  
}

module.exports = {
 createNotification,
 getNotificationCount,
 getNotifications,   
}