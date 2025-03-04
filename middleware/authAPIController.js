const express = require('express');
const sql = require('mssql');
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

const login = async (req, res) => {
    const { UserName, Password } = req.body;

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('UserName', sql.NVarChar, UserName)
            .query('SELECT * FROM Contributors WHERE UserName = @UserName');

        const contributor = result.recordset[0];

        if (!contributor || contributor.Password !== Password) {
            return res.json({ issuccess: false, error: "Invalid username or password", contributor });
        }

        req.session.isLoggedIn = true;
        req.session.contributor = contributor;

        res.json({ issuccess: true, message: "", contributor });
    } catch (error) {
        res.json({ issuccess: false, message: "Login error: " + error, contributor });
    }
};

const register = async (req, res) => {
    const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Community, Picture, IsActive } = req.body;

    try {
        const pool = await getPool();

        // Check if username already exists
        const existingUser = await pool.request()
            .input('UserName', sql.NVarChar, UserName)
            .query('SELECT * FROM Contributors WHERE UserName = @UserName');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ issuccess: false, message: "Username already exists.", contributor: null });
        }

        let newCommunityId = Community;

        if (!Community || Community == '') {
            if (req.body.CommunityName && req.body.CommunityName.trim() !== '') {
                const newCommunityResult = await pool.request()
                    .input('CommunityName', sql.NVarChar, req.body.CommunityName)
                    .input('CommunityDescription', sql.NVarChar, req.body.CommunityName)
                    .input('DateCreated', sql.DateTime, new Date())
                    .query('INSERT INTO Communities (Name, Description, DateCreated) OUTPUT INSERTED.ID VALUES (@CommunityName, @CommunityDescription, @DateCreated)');
                
                newCommunityId = newCommunityResult.recordset[0].ID;
            }
        }

        await pool.request()
            .input('UserID', UserName)
            .input('UserName', UserName)
            .input('Password', Password)
            .input('FirstName', FirstName)
            .input('LastName', LastName)
            .input('Email', Email)
            .input('Role', Role)
            .input('PhoneNumber', PhoneNumber)
            .input('Picture', Picture)
            .input('CommunityId', newCommunityId)
            .input('IsActive', IsActive)
            .input('StartDate', new Date())
            .query("INSERT INTO Contributors (UserID, UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, CommunityId, IsActive, StartDate) VALUES (@UserID, @UserName, @Password, @FirstName, @LastName, @Email, @Role, @PhoneNumber, @Picture, @CommunityId, @IsActive, @StartDate)");

        res.status(201).json({ issuccess: true, message: "Registration successful", contributor: null });
    } catch (error) {
        res.json({ issuccess: false, message: "Registration error: " + error, contributor: null });
    }
};

// Define routes
router.post('/login', login);
router.post('/register', register);

module.exports = router;
