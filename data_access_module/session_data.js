require('dotenv').config();
const pool = require('../config/db');

const createUserSession = async (session_id,user_id,user_role,user_agent,origin,created_at,expires_at) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('INSERT INTO sessions(session_id,user_id,user_role,user_agent,user_ip,created_at,expires_at)VALUES(?,?,?,?,?,?,?);', [ session_id,user_id,user_role,user_agent,origin,created_at,expires_at]);
        connection.release();
        return rows;
    } catch (err) {
        throw err;
    }
}

const getUserSession = async (session_id) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM sessions WHERE session_id = ?;', [ session_id]);
        connection.release();
        return rows;
    } catch (err) {
        throw err;
    }
}

const getUserSessionByEmail = async (email) =>{

    const connection = await pool.getConnection();
    try {
        const [[ user_id]] = await connection.execute('SELECT user_id FROM users WHERE email = ?;', [email]);
        const [rows] = await connection.execute('SELECT * FROM sessions WHERE user_id = ?;',[ user_id.user_id]);
        connection.release();
        return rows;
    } catch (err) {
        throw err;
    }
}

const deleteUserSession = async ( session_id) =>{
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('DELETE FROM sessions WHERE session_id = ?;', [ session_id]);
        connection.release();
        return rows;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    deleteUserSession,
    createUserSession,
    getUserSession,
    getUserSessionByEmail,   
}