const multer = require('multer');
const path = require('path');
const Contributor = require("../models/contributor");
const Community = require('../models/community');

const showLoginPage = (req, res) => {
    res.render("login", { error: null });
};

const login = async (req, res) => {
    const { UserName, Password } = req.body;

    try {
        // Find contributor by username
        const contributor = await Contributor.findOne({ UserName });

        if (!contributor || contributor.Password !== Password) {
            return res.render("login", { error: "Invalid username or password" });
        }

        // Store contributor info in session
        req.session.isLoggedIn = true;
        req.session.contributor = contributor;
        res.redirect("/"); // Redirect to a dashboard or home page
    } catch (error) {
        console.error("Login error:", error);
        res.render("login", { error: "An error occurred. Please try again." });
    }
};

const showRegisterPage = async (req, res) => {
    const communities = await Community.find();

    res.render("register", { error: null, communities });
};

const register = async (req, res) => {
    const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, Community } = req.body;

    try {
        // Check if username already exists
        const existingUser = await Contributor.findOne({ UserName });
        if (existingUser) {
            return res.render("register", { error: "Username already exists." });
        }

        // Hash the password
        const hashedPassword = Password; // await bcrypt.hash(Password, 10);

        // Create new contributor
        const newContributor = new Contributor({
            UserName,
            Password: hashedPassword,
            FirstName,
            LastName,
            Email,
            Role,
            PhoneNumber,
            Picture: req.file ? req.file.filename : null,
            Community
        });

        await newContributor.save();

        // Redirect to login page after successful registration
        res.redirect("/login");
    } catch (error) {
        console.error("Registration error:", error);
        res.render("register", { error: "An error occurred. Please try again." });
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
}
