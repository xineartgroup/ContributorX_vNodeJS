const multer = require('multer');
const path = require('path');
const Expectation = require('../models/expectation');
const Contributor = require('../models/contributor');
const Contribution = require('../models/contribution');

const expectationIndex = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalExpectations = await Expectation.countDocuments();
        const expectations = await Expectation.find().populate('Contributor Contribution').sort({ createdAt: -1 }).skip(skip).limit(limit);

        res.render('expectation/index', {
            title: 'Expectation List',
            expectations,
            currentPage: page,
            totalPages: Math.ceil(totalExpectations / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationCreateGet = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const contributors = await Contributor.find();
        const contributions = await Contribution.find();
        res.render('expectation/create', { title: 'New Expectation', contributors, contributions });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationCreatePost = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus } = req.body;
        const expectation = new Expectation({
            Contributor,
            Contribution,
            AmountPaid,
            AmountToApprove,
            PaymentStatus,
            PaymentReciept: req.file ? req.file.filename : null
        });

        await expectation.save();
        res.redirect('/expectation');
    } catch (err) {
        console.error("Error saving expectation:", err);
        res.status(500).send("Error saving expectation.");
    }
};

const expectationUpdateGet = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const expectation = await Expectation.findById(req.params.id);
        const contributors = await Contributor.find();
        const contributions = await Contribution.find();
        if (!expectation) return res.status(404).send('Expectation not found');

        res.render('expectation/update', { title: 'Update Expectation', expectation, contributors, contributions });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationUpdatePost = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const updatedData = {
            Contributor: req.body.Contributor,
            Contribution: req.body.Contribution,
            AmountPaid: req.body.AmountPaid,
            AmountToApprove: req.body.AmountToApprove,
            PaymentStatus: req.body.PaymentStatus,
            PaymentReciept: req.body.PaymentReciept
        };

        await Expectation.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.redirect('/expectation');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationDeleteGet = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const expectation = await Expectation.findById(req.params.id).populate('Contributor Contribution');
        if (!expectation) return res.status(404).send('Expectation not found');

        res.render('expectation/delete', { title: 'Delete Expectation', expectation });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationDeletePost = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        await Expectation.findByIdAndDelete(req.params.id);
        res.redirect('/expectation');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting expectation' });
    }
};

const expectationPaymentGet = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
    
        console.log("Expectation ID:", req.params.id);
        const expectation = await Expectation.findById(req.params.id).populate('Contributor Contribution');
        if (!expectation) return res.status(404).send("Expectation not found");

        res.render('expectation/makePayment', { title: 'Update Expectation', expectation });
    } catch (err) {
        console.error("Error fetching expectation:", err);
        res.status(500).send("Server error");
    }
};

const expectationPaymentPost = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const expectation = await Expectation.findById(req.params.id);
        expectation.AmountToApprove = req.body.AmountToApprove;
        expectation.PaymentMethod = req.body.PaymentMethod;
        expectation.PaymentStatus = 1; // Mark as processing

        if (req.file) {
            expectation.PaymentReciept = req.file.filename;
        }

        await expectation.save();
        console.log("Updated Expectation:", expectation); // Debugging

        res.redirect('/');
    } catch (err) {
        console.error("Error processing payment:", err);
        res.status(500).send("Server error.");
    }
};

function paymentComplete(status) {
    return status === 2 || status === 3;
}

module.exports = {
    expectationIndex,
    expectationCreateGet,
    expectationCreatePost,
    expectationUpdateGet,
    expectationUpdatePost,
    expectationDeleteGet,
    expectationDeletePost,
    expectationPaymentGet,
    expectationPaymentPost
};
