const { makeApiRequest } = require('./_baseController');
const express = require("express");
const upload = require('../middleware/upload');
const http = require('http');

const router = express.Router();

const showLoginPage = (req, res) => {
    res.render("login", { error: null });
};

const getCommunities = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/community/api', sessionCookie);
    if (result.issuccess) {
        return result.communities;
    }else{
        throw new Error("Unable to retrieve communities");
    }
};

const login = async (req, res) => {
    try {
        const { UserName, Password } = req.body;
        const sessionCookie = req.headers.cookie; // Pass the user's session cookie

        const result = await makeApiRequest('POST', '/auth/api/login', sessionCookie, { UserName, Password });

        if (result.contributor && result.contributor.Password === Password) {
            req.session.isLoggedIn = true;
            req.session.contributor = result.contributor;
            res.redirect("/");
        } else {
            res.render("login", { error: "Invalid username or password" });
        }
    } catch (error) {
        res.render("login", { error: "Login error: " + error });
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
    try {
        const sessionCookie = req.headers.cookie;
        const communities = await getCommunities();

        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Community, IsActive } = req.body;
        let Picture = req.file ? req.file.filename : '';

        const result = await makeApiRequest('POST', '/auth/api/register', sessionCookie, {
            UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Community, Picture, IsActive
        });

        if (result.issuccess) {
            res.redirect("/login");
        } else {
            res.render("register", { error: "Registration Failed!!! " + result.message, communities });
        }
    } catch (error) {
        res.render("register", { error: "Registration error: " + error, communities });
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