const getPool = require('../middleware/sqlconnection');

async function getGroups() {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM Groups');
        return result.recordset;
    } catch (err) {
        console.error("Database error:", err);
    }
}

module.exports = getGroups;