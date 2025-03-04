const express = require("express");
const upload = require('../middleware/upload');
const http = require('http');

const router = express.Router();

const showLoginPage = (req, res) => {
    res.render("login", { error: null });
};

const getCommunities = async () => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/community/api',
            method: 'GET'
        };

        const request = http.request(options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (!result.issuccess) {
                        return reject("Unable to retrieve communities");
                    }
                    resolve(result.communities);
                } catch (error) {
                    reject("Invalid API response");
                }
            });
        });

        request.on('error', (error) => {
            reject(error);
        });

        request.end();
    });
};

const login = async (req, res) => {
    try {
        const { UserName, Password } = req.body;
        const loginData = JSON.stringify({
            UserName: UserName,
            Password: Password
        });
        
        const loginOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/auth/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        };

        const request = http.request(loginOptions, (response) => {
            let data = '';
        
            response.on('data', (chunk) => {
                data += chunk;
            });
        
            response.on('end', () => {
                const result = JSON.parse(data);      

                if (result.contributor && result.contributor.Password === Password) {
                    req.session.isLoggedIn = true;
                    req.session.contributor = result.contributor;
                    res.redirect("/");
                }
                else{
                    return res.render("login", { error: "Invalid username or password" });
                }
            });
        });
        
        request.on('error', (error) => {
            res.render("login", { error: "Request error:" + error });
        });
        
        request.write(loginData);
        request.end();
    } catch (error) {
        res.render("login", { error: "Login error:" + error });
    }
};

const showRegisterPage = async (req, res) => {
    try {
        const communities = await getCommunities();
        res.render("register", { error: null, communities });
    } catch (error) {
        res.render("register", { error: "Error fetching communities:" + error, communities: [] });
    }
};

const register = async (req, res) => {
    const communities = await getCommunities(); // await pool.request().query('SELECT * FROM Communities');

    try {
        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Community, IsActive } = req.body;
        let Picture = req.file ? req.file.filename : '';

        const registerData = JSON.stringify({
            UserName: UserName,
            Password: Password,
            FirstName: FirstName,
            LastName: LastName,
            Email: Email,
            Role: Role,
            PhoneNumber: PhoneNumber,
            Community: Community,
            Picture: Picture,
            IsActive: IsActive
        });
        
        const loginOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/auth/api/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(registerData)
            }
        };
        
        const request = http.request(loginOptions, (response) => {
            let data = '';
        
            response.on('data', (chunk) => {
                data += chunk;
            });
        
            response.on('end', () => {
                const result = JSON.parse(data);       

                if (result.issuccess) {
                    res.redirect("/login");
                }
                else{
                    return res.render("register", { error: "Registration Failed!!! " + result.message, communities });
                }

            });
        });
        
        request.on('error', (error) => {
            res.render("register", { error: "Request error:" + error, communities });
        });
        
        request.write(registerData);
        request.end();
    } catch (error) {
        res.render("register", { error: "Registration error:" + error, communities });
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

router.get("/login", showLoginPage);
router.post("/login", login);
router.get("/register", showRegisterPage);
router.post("/register", upload.single("Picture"), register);
router.get("/logout", logout);

module.exports = router;