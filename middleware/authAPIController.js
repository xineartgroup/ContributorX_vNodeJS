const express = require('express');
const sql = require('mssql');
const getPool = require('../middleware/sqlconnection');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { UserName, Password } = req.body;

        const pool = await getPool();
        const result = await pool.request()
            .input('UserName', sql.NVarChar, UserName)
            .query('SELECT * FROM Contributors WHERE UserName = @UserName');

        const contributor = result.recordset.length > 0 ? result.recordset[0] : null;

        if (contributor) {
            const isMatch = await bcrypt.compare(Password, contributor.Password);
            if (isMatch) {
                req.session.isLoggedIn = true;
                req.session.contributor = contributor;

                return res.json({ issuccess: true, message: "", contributor });
            }
        }

        return res.json({ issuccess: false, message: "Invalid username or password", contributor });
    } catch (error) {
        return res.json({ issuccess: false, message: "Login error: " + error, contributor: null });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, CommunityId, Picture, IsActive } = req.body;

        const pool = await getPool();

        // Check if username already exists
        const existingUser = await pool.request()
            .input('UserName', sql.NVarChar, UserName)
            .query('SELECT * FROM Contributors WHERE UserName = @UserName');

        if (existingUser.recordset.length > 0) {
            return res.json({ issuccess: false, message: "Username already exists.", contributor: null });
        }

        let newCommunityId = CommunityId;

        if (!CommunityId || CommunityId == '' || CommunityId == 0) {
            if (req.body.CommunityName && req.body.CommunityName.trim() !== '') {
                const newCommunityResult = await pool.request()
                    .input('CommunityName', sql.NVarChar, req.body.CommunityName)
                    .input('CommunityDescription', sql.NVarChar, req.body.CommunityName)
                    .input('DateCreated', sql.DateTime, new Date())
                    .query('INSERT INTO Communities (Name, Description, DateCreated) OUTPUT INSERTED.ID VALUES (@CommunityName, @CommunityDescription, @DateCreated)');
                
                newCommunityId = newCommunityResult.recordset.length > 0 ? newCommunityResult.recordset[0].ID : 0;
            }
        }

        const hashedPassword = await bcrypt.hash(Password, 10);

        const result = await pool.request()
            .input('UserID', UserName)
            .input('UserName', UserName)
            .input('Password', hashedPassword)
            .input('FirstName', FirstName)
            .input('LastName', LastName)
            .input('Email', Email)
            .input('Role', Role)
            .input('PhoneNumber', PhoneNumber)
            .input('Picture', Picture)
            .input('CommunityId', newCommunityId)
            .input('IsActive', IsActive)
            .input('StartDate', new Date())
            .query("INSERT INTO Contributors (UserID, UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, CommunityId, IsActive, StartDate) OUTPUT INSERTED.ID VALUES (@UserID, @UserName, @Password, @FirstName, @LastName, @Email, @Role, @PhoneNumber, @Picture, @CommunityId, @IsActive, @StartDate)");

        const Id = result.recordset.length > 0 ? result.recordset[0].ID : 0;
        
        return res.json({ issuccess: true, message: "Registration successful", contributor: { Id, UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, CommunityId, IsActive } });
    } catch (error) {
        return res.json({ issuccess: false, message: "Registration error: " + error, contributor: null });
    }
});

module.exports = router;
