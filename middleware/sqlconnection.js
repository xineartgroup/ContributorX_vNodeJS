const sql = require('mssql');
const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());

const config = {
    user: "obinna",
    password: "P@$$w0rd",
    server: "CHIKWENDU_PC\\SQLEXPRESS", // Use double backslashes to escape '\'
    database: "MicroserviceTest",
    options: {
        trustServerCertificate: true,
        enableArithAbort: true,
        instancename: "SQLEXPRESS"
    },
    port: 1433
};

async function getPool() {
    try {
        return await sql.connect(config);
    } catch (error) {
        console.error("Database connection error:", error);
        throw error;
    }
}

module.exports = getPool;