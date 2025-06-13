require('dotenv').config();
const pool = require('../config/db');

const createAgreement = async (agreement, lease_duration, check_in_date) => {
    const connection = await pool.getConnection();
    try {
      const { tenant_id, owner_id, listing_id } = agreement;
      const lease_start_date = new Date(check_in_date).getTime();
      const lease_duration_mill = lease_duration * 24 * 60 * 60 * 1000;
      const lease_end_date = lease_start_date + lease_duration_mill;
      const [result] = await connection.execute(
        `INSERT INTO agreement(
          tenant_id,
          owner_id,
          listing_id,
          lease_start_date,
          lease_end_date
        ) VALUES(?,?,?,?,?);`,
        [tenant_id, owner_id, listing_id, lease_start_date, lease_end_date]
      );
  
      return result;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
};


const extendAgreement = async (agreement_id) => {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`SELECT * FROM agreement WHERE agreement_id = ?;`,[agreement_id]);
      const agreement = result[0];

      const start_date = agreement.lease_start_date;
      const end_date = agreement.lease_end_date;
      const duration = end_date - start_date;

      const new_end_date = end_date + duration;

      const [update_result] = await connection.execute(
        `UPDATE agreement SET lease_start_date = ?, lease_end_date = ?`,
        [end_date, new_end_date]);
  
      return update_result;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
};


const getAgreements = async (user_id) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
              agreement.*,
              JSON_OBJECT(
                  "user_id", tenant_user.user_id,
                  "full_name", tenant_user.full_name,
                  "gender", tenant_user.gender,
                  "phone_number", tenant_user.phone_number,
                  "date_of_birth", tenant_user.date_of_birth,
                  "email", tenant_user.email,
                  "zone", tenant_user.zone,
                  "woreda", tenant_user.woreda,
                  "date_joined", tenant_user.date_joined,
                  "account_status", tenant_user.account_status,
                  "region", tenant_user.region,
                  "job_type", tenant_user.job_type,
                  "married", tenant_user.married,
                  "id_photo_url", tenant_user.id_photo_url,
                  "id_type", tenant_user.id_type,
                  "id_number", tenant_user.id_number,
                  "url", COALESCE(tenant_photos.url, '')
              ) AS tenant,
              listing.price_per_duration AS price_per_duration,
              listing.payment_currency AS payment_currency,
              payment_info.sub_account_id AS sub_account_id,
              JSON_OBJECT(
                  "user_id", owner_user.user_id,
                  "full_name", owner_user.full_name,
                  "gender", owner_user.gender,
                  "phone_number", owner_user.phone_number,
                  "date_of_birth", owner_user.date_of_birth,
                  "email", owner_user.email,
                  "zone", owner_user.zone,
                  "woreda", owner_user.woreda,
                  "date_joined", owner_user.date_joined,
                  "account_status", owner_user.account_status,
                  "region", owner_user.region,
                  "job_type", owner_user.job_type,
                  "married", owner_user.married,
                  "id_photo_url", tenant_user.id_photo_url,
                  "id_type", tenant_user.id_type,
                  "id_number", tenant_user.id_number,
                  "url", COALESCE(owner_photos.url, '')
              ) AS owner
          FROM agreement
          LEFT JOIN user AS tenant_user ON agreement.tenant_id = tenant_user.user_id
          LEFT JOIN user_photos AS tenant_photos ON tenant_user.user_id = tenant_photos.user_id
          LEFT JOIN user AS owner_user ON agreement.owner_id = owner_user.user_id
          LEFT JOIN user_photos AS owner_photos ON owner_user.user_id = owner_photos.user_id
          LEFT JOIN listing ON listing.listing_id = agreement.listing_id
          LEFT JOIN payment_info ON owner_user.user_id = payment_info.user_id
          WHERE agreement.owner_id = ? OR agreement.tenant_id = ?;`,[user_id, user_id]
        );
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const cancelAgreements = async (tenant_id, reservation_id) =>{
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute('DELETE FROM agreement WHERE tenant_id = ?;',[tenant_id]);
        return result;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

module.exports = {
    cancelAgreements,
    createAgreement,
    extendAgreement,
    getAgreements
};