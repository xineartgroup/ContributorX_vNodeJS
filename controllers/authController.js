const { makeApiRequest } = require('./_baseController');
const express = require("express");
const upload = require('./upload');
const http = require('http');

const router = express.Router();

const showLoginPage = (req, res) => {
    res.render("login", { error: null });
};

const getCommunities = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/communities/api/all', sessionCookie);
    if (result.issuccess) {
        return result.communities;
    }else{
        throw new Error("Unable to retrieve communities");
    }
};

const login = async (req, res) => {
    try {
        const { UserName, Password } = req.body;

        const result = await makeApiRequest('POST', '/auth/api/login', req.headers.cookie, { UserName, Password });

        if (result.issuccess) {
            req.session.isLoggedIn = true;
            req.session.contributor = result.contributor;
            res.redirect("/");
        } else {
            return res.render("login", { error: result.message });
        }
    } catch (error) {
        return res.render("login", { error: "Login error: " + error });
    }
};

const showRegisterPage = async (req, res) => {
    try {
        const communities = await getCommunities();
        return res.render("register", { error: null, communities });
    } catch (error) {
        return res.render("register", { error: "Error fetching communities:" + error, communities: [] });
    }
};

const register = async (req, res) => {
    try {
        const communities = await getCommunities();

        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, CommunityId, CommunityName, IsActive } = req.body;
        let Picture = req.file ? req.file.filename : '';

        const result = await makeApiRequest('POST', '/auth/api/register', req.headers.cookie, {
            UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, CommunityId, CommunityName, Picture, IsActive
        });

        if (result.issuccess) {
            return res.redirect("/login");
        } else {
            return res.render("register", { error: "Registration Failed!!! " + result.message, communities });
        }
    } catch (error) {
        return res.render("register", { error: "Registration error: " + error, communities: [] });
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