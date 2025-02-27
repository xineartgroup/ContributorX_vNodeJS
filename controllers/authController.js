const sql = require('mssql');
const getPool = require('../middleware/sqlconnection');

const showLoginPage = (req, res) => {
    res.render("login", { error: null });
};

const login = async (req, res) => {
    const { UserName, Password } = req.body;

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('UserName', sql.NVarChar, UserName)
            .query('SELECT * FROM Contributors WHERE UserName = @UserName');

        const contributor = result.recordset[0];

        if (!contributor || contributor.Password !== Password) {
            return res.render("login", { error: "Invalid username or password" });
        }

        req.session.isLoggedIn = true;
        req.session.contributor = contributor;
        res.redirect("/");
    } catch (error) {
        console.error("Login error:", error);
        res.render("login", { error: "An error occurred. Please try again." });
    }
};

const showRegisterPage = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM Communities');
        res.render("register", { error: null, communities: result.recordset });
    } catch (error) {
        console.error("Error fetching communities:", error);
        res.render("register", { error: "An error occurred. Please try again.", communities: [] });
    }
};

const register = async (req, res) => {
    const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, communityId } = req.body;
    let Picture = req.file ? req.file.filename : null;

    try {
        const pool = await getPool();

        // Check if username already exists
        const existingUser = await pool.request()
            .input('UserName', sql.NVarChar, UserName)
            .query('SELECT * FROM Contributors WHERE UserName = @UserName');

        if (existingUser.recordset.length > 0) {
            return res.render("register", { error: "Username already exists." });
        }

        let newCommunityId = communityId;

        if (!communityId || communityId == '') {
            if (req.body.CommunityName && req.body.CommunityName.trim() !== '') {
                const newCommunityResult = await pool.request()
                    .input('CommunityName', sql.NVarChar, req.body.CommunityName)
                    .input('CommunityDescription', sql.NVarChar, req.body.CommunityName)
                    .query('INSERT INTO Communities (Name, Description) OUTPUT INSERTED.ID VALUES (@CommunityName, @CommunityDescription)');
                newCommunityId = newCommunityResult.recordset[0].ID;
            }
        }

        await pool.request()
            .input('UserName', sql.NVarChar, UserName)
            .input('Password', sql.NVarChar, Password) // Hashing is recommended
            .input('FirstName', sql.NVarChar, FirstName)
            .input('LastName', sql.NVarChar, LastName)
            .input('Email', sql.NVarChar, Email)
            .input('Role', sql.NVarChar, Role)
            .input('PhoneNumber', sql.NVarChar, PhoneNumber)
            .input('Picture', sql.NVarChar, Picture)
            .input('CommunityID', sql.Int, newCommunityId)
            .query('INSERT INTO Contributors (UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, CommunityID) VALUES (@UserName, @Password, @FirstName, @LastName, @Email, @Role, @PhoneNumber, @Picture, @CommunityID)');

        res.redirect("/login");
    } catch (error) {
        console.error("Registration error:", error);
        try {
            const pool = await getPool();
            const communities = await pool.request().query('SELECT * FROM Communities');
            res.render("register", { error: "An error occurred. Please try again.", communities: communities.recordset });
        } catch (error) {
            res.render("register", { error: "An error occurred. Please try again.", communities: [] });
        }
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/login');
        }
    });
};

module.exports = {
    showLoginPage,
    login,
    showRegisterPage,
    register,
    logout
};