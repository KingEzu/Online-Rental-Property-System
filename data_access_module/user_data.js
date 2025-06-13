require('dotenv').config();
const pool = require('../config/db');

const createUser = async (user,contactInfo,photoUrl) =>{
    const connection = await pool.getConnection();
    connection.beginTransaction();
    try {
    const {
        full_name,gender,phone_number,email,
        zone,woreda,job_type,id_type,id_number,id_photo_url,date_of_birth,married,
        account_status,region,user_role,citizenship} = user;

        const [result] = await connection.execute(
           `INSERT INTO user(
            full_name,
            gender,
            phone_number,
            email,
            zone,
            woreda,
            job_type,
            id_type,
            id_number,
            id_photo_url,
            date_of_birth,
            account_status,
            region,
            married,
            user_role,
            citizenship	) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
        [full_name,gender,phone_number,email,zone,woreda,job_type,id_type,id_number,id_photo_url,date_of_birth,account_status,region,married,user_role, citizenship]);

        const placeholders = contactInfo.map(() => '(?, ?)').join(',');
        const values = contactInfo.reduce((acc, contact) => {
            acc.push(user_id, contact.full_name, contact.contact_address);
            return acc;
        }, []);
    
        if (contactInfo && contactInfo.length > 0) {
            await connection.execute(`INSERT INTO contact_info (user_id, contact_name, contact_address) VALUES ${placeholders}`, [values]);   
        }

        if (photoUrl) {
            await connection.execute(`INSERT INTO user_photos (user_id, url) VALUES(?,?);`,[result.insertId, photoUrl]);
        }
        
        connection.commit();
        return result;
    } catch (error) {
        connection.rollback();
        throw error;
    }finally{
        connection.release();
    }
}

const addcontactInfo = async (user_id, contactInfo) => {
    const connection = await pool.getConnection();
    try {
      const placeholders = contactInfo.map(() => '(?, ?)').join(',');
      const values = contactInfo.reduce((acc, contact) => {
        acc.push(user_id, contact.full_name, contact.contact_address);
        return acc;
      }, []);
  
      const query = `INSERT INTO contact_info (user_id, contact_name, contact_address) VALUES ${placeholders}`;
      const [rows] = await connection.execute(query, values);

      return rows;
    } catch (err) {
      throw err;
    } finally {
      connection.release();
    }
};
  
const createUserAuth = async (userId, authString) =>{
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.
        execute('INSERT INTO user_auth(user_id, auth_string) VALUES(?, ?);',
        [userId, authString]);
        return result;
    } catch (error) {
        throw error;
    }finally{
        connection.release();
    }
}


const getUser = async (userId) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`SELECT 
        user.*,
        COALESCE(( 
            SELECT user_photos.url 
            FROM user_photos 
            WHERE user.user_id = user_photos.user_id 
            LIMIT 1 
        ),'') AS photo_url,
        COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'contact_name', contact_info.contact_name, 
                    'contact_address', contact_info.contact_address
                )
            ), JSON_ARRAY()
        ) AS contact_infos 
        FROM user LEFT JOIN contact_info ON user.user_id = contact_info.user_id 
        WHERE user.user_id = ? GROUP BY user.user_id;`, [userId]);
        return rows[0];
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const getUserByEmail = async (email) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
        `SELECT 
        user.*,
        COALESCE(
        (SELECT user_auth.auth_string 
            FROM user_auth 
            WHERE user.user_id = user_auth.user_id 
            LIMIT 1), 
        '') AS auth_string,
        COALESCE(
        (SELECT user_photos.url 
            FROM user_photos 
            WHERE user.user_id = user_photos.user_id 
            LIMIT 1), 
        '') AS photo_url,
        COALESCE(
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'contact_name', contact_info.contact_name, 
                'contact_address', contact_info.contact_address
            )), JSON_ARRAY()) AS contact_infos 
        FROM user LEFT JOIN contact_info ON user.user_id = contact_info.user_id 
        WHERE user.email = ? GROUP BY user.user_id;`, [email]);
        return rows[0];
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const getAllUsers = async () =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`SELECT 
    user.*,
    COALESCE((SELECT user_photos.url 
        FROM user_photos 
        WHERE user.user_id = user_photos.user_id 
        LIMIT 1), '') AS photo_url,
    COALESCE(
        JSON_ARRAYAGG(
            JSON_OBJECT('contact_name', contact_info.contact_name, 'contact_address', contact_info.contact_address)
        ), JSON_ARRAY()) AS contact_infos FROM user 
    LEFT JOIN contact_info ON user.user_id = contact_info.user_id GROUP BY user.user_id;`);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const updateUser = async (userId, userData, photoUrl) => {
    const connection = await pool.getConnection();
    try {
        const setClause = Object.keys(userData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(userData);
        values.push(userId);   
        const query = `UPDATE user SET ${setClause} WHERE user_id = ?;`;
        console.log(values);
        
        const [rows] = await connection.execute(query, values);
        if (photoUrl) {
            await connection.execute(`UPDATE user_photos SET url = ? WHERE user_id = ?;`,[photoUrl, userId]);
        }
        return rows;
    } catch (err) {
        throw err;
    } finally {
        connection.release();
    }
}

const changeUserStatus = async (userId, status) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`UPDATE user SET account_status = ? WHERE user_id = ?;`, [status ,userId]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const changeUserAuthString = async (userId, auth_string) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`UPDATE user_auth SET auth_string = ? WHERE user_id = ?;`, [auth_string ,userId]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const getUserStatus = async (userId) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT account_status FROM user WHERE user_id = ?;', [userId]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

const deleteUser = async (userId) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('DELETE FROM user WHERE user_id = ?;', [userId]);
        return rows;
    } catch (err) {
        throw err;
    }finally{
        connection.release();
    }
}

module.exports = {
    createUser,
    createUserAuth,
    changeUserStatus,
    getUserStatus,
    getUser,
    getUserByEmail,
    getAllUsers,
    updateUser,
    deleteUser,
    changeUserAuthString,
    addcontactInfo
};
