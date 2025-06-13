require('dotenv').config();
const pool = require('../config/db');

const createRequest = async (reservation) =>{
const connection = await pool.getConnection();
   connection.beginTransaction();
  try {
      const {tenant_id,owner_id,additional_message,listing_id,selected_payment_method,price_offer, stay_dates}  = reservation;
        const [result] = await connection.
        execute(`INSERT INTO reservation(tenant_id,owner_id,additional_message,listing_id,selected_payment_method,price_offer) 
        VALUES(?,?,?,?,?,?);`,[tenant_id,owner_id,additional_message,listing_id,selected_payment_method,price_offer]);

        const placeholders = stay_dates.map(() => '(?, ?)').join(',');
        const values = []; 
        Object.values(stay_dates).map((v, i) => {
            values.push(result.insertId);
            values.push(v);
        });
        const query = `INSERT INTO stay_dates (reservation_id,stay_date) VALUES ${placeholders}`;
        await connection.execute(query, values);

        connection.commit();
        return result;
    } catch (error) {
        connection.rollback()
        throw error;
    }finally{
        connection.release();
    }
}

const getReservations = async (owner_id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
                reservation.*,
                listing.title as listing_title,
                listing.description as description,
                listing.lease_duration_days as lease_duration_days,
                JSON_OBJECT(
                    "user_id", user.user_id,
                    "full_name", user.full_name,
                    "gender", user.gender,
                    "phone_number", user.phone_number,
                    "date_of_birth", user.date_of_birth,
                    "email", user.email,
                    "zone", user.zone,
                    "woreda", user.woreda,
                    "date_joined", user.date_joined,
                    "account_status", user.account_status,
                    "region", user.region,
                    "job_type", user.job_type,
                    "married", user.married,
                    "id_photo_url", user.id_photo_url,
                    "id_number", user.id_number,
                    "id_type", user.id_type
                ) AS tenant,
                (SELECT JSON_ARRAYAGG(stay_dates.stay_date)
                 FROM stay_dates 
                 WHERE stay_dates.reservation_id = reservation.reservation_id) AS stay_dates 
            FROM reservation 
            LEFT JOIN user ON user.user_id = reservation.tenant_id 
            LEFT JOIN listing ON reservation.listing_id = listing.listing_id 
            WHERE ( reservation.owner_id = ? OR reservation.tenant_id = ? ) AND reservation.status = 2000;`,
            [owner_id,owner_id]);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const getReservationsReports = async () => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
                reservation.*,
                listing.title as listing_title,
                listing.description as description,
                listing.lease_duration_days as lease_duration_days,
                JSON_OBJECT(
                    "user_id", user.user_id,
                    "full_name", user.full_name,
                    "gender", user.gender,
                    "phone_number", user.phone_number,
                    "date_of_birth", user.date_of_birth,
                    "email", user.email,
                    "zone", user.zone,
                    "woreda", user.woreda,
                    "date_joined", user.date_joined,
                    "account_status", user.account_status,
                    "region", user.region,
                    "job_type", user.job_type,
                    "married", user.married,
                    "id_photo_url", user.id_photo_url,
                    "id_number", user.id_number,
                    "id_type", user.id_type
                ) AS tenant,
                (SELECT JSON_ARRAYAGG(stay_dates.stay_date)
                 FROM stay_dates 
                 WHERE stay_dates.reservation_id = reservation.reservation_id) AS stay_dates 
            FROM reservation 
            LEFT JOIN user ON user.user_id = reservation.tenant_id 
            LEFT JOIN listing ON reservation.listing_id = listing.listing_id;`);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const getReservation = async (owner_id, reservation_id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
                reservation.*,
                listing.title as listing_title,
                listing.description as description,
                listing.lease_duration_days as lease_duration_days,
                JSON_OBJECT(
                    "user_id", user.user_id,
                    "full_name", user.full_name,
                    "gender", user.gender,
                    "phone_number", user.phone_number,
                    "date_of_birth", user.date_of_birth,
                    "email", user.email,
                    "zone", user.zone,
                    "woreda", user.woreda,
                    "date_joined", user.date_joined,
                    "account_status", user.account_status,
                    "region", user.region,
                    "job_type", user.job_type,
                    "married", user.married,
                    "id_photo_url", user.id_photo_url,
                    "id_number", user.id_number,
                    "id_type", user.id_type
                ) AS tenant,
                (SELECT JSON_ARRAYAGG(stay_dates.stay_date)
                 FROM stay_dates 
                 WHERE stay_dates.reservation_id = reservation.reservation_id) AS stay_dates 
            FROM reservation 
            LEFT JOIN user ON user.user_id = reservation.tenant_id 
            LEFT JOIN listing ON reservation.listing_id = listing.listing_id 
            WHERE reservation.owner_id = ? AND reservation.reservation_id = ?;`,
            [owner_id, reservation_id]
        );
        return rows[0];
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const getRequest = async (tenant_id, reservation_id) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`SELECT 
            reservation.*,
            (SELECT JSON_ARRAYAGG(stay_dates.stay_date) 
                FROM stay_dates 
                WHERE stay_dates.reservation_id = reservation.reservation_id) AS stay_dates 
            FROM reservation WHERE tenant_id = ? AND reservation_id = ?;`, [tenant_id, reservation_id]);
        return rows[0];
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}


const getRequests = async (tenant_id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
        `SELECT reservation.*, (SELECT JSON_ARRAYAGG(stay_dates.stay_date) FROM stay_dates WHERE 
        stay_dates.reservation_id = reservation.reservation_id) AS stay_dates FROM reservation 
        WHERE tenant_id = ?;`,[tenant_id]);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const appoveReservation = async (owner_id,reservation_id) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
        'UPDATE reservation SET status = 3000 WHERE reservation.reservation_id = ? AND reservation.owner_id = ?;',
        [reservation_id, owner_id]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const declineReservation = async (owner_id,reservation_id) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('UPDATE reservation SET status = 1000 WHERE reservation.reservation_id = ? AND reservation.owner_id = ?;', [reservation_id, owner_id]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const cancelReservation = async (tenant_id, reservation_id) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('DELETE FROM reservation WHERE tenant_id = ? AND reservation_id = ?;', [tenant_id, reservation_id]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

module.exports = {
    createRequest,
    getRequests,
    getRequest,
    appoveReservation,
    declineReservation,
    cancelReservation,
    getReservations,
    getReservation,
    getReservationsReports
};
