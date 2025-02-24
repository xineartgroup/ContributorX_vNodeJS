const multer = require('multer');
const path = require('path');
const Expense = require('../models/expense');
const Community = require('../models/community');

const expenseIndex = async (req, res) => {
    const sessionData = req.session;

    if (!sessionData || !req.session.isLoggedIn) {
        res.redirect('/login');
      }

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalExpenses = await Expense.countDocuments();
        const expenses = await Expense.find().populate('Community').sort({ createdAt: -1 }).skip(skip).limit(limit);

        res.render('expense/index', {
            title: 'Expense List',
            expenses,
            currentPage: page,
            totalPages: Math.ceil(totalExpenses / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expenseCreateGet = async (req, res) => {
    const sessionData = req.session;

    if (!sessionData || !req.session.isLoggedIn) {
        res.redirect('/login');
      }

    try {
        const communities = await Community.find();
        res.render('expense/create', { title: 'New Expense', communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err);
    }
};

const expenseCreatePost = async (req, res) => {
    try {
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
        }

        const { Name, Description, AmountPaid, Community } = req.body;
        if (!req.file) {
            return res.status(400).send("Payment Receipt file is required.");
        }

        const expense = new Expense({
            Name,
            Description,
            AmountPaid,
            Community,
            PaymentReciept: req.file.filename
        });

        await expense.save();
        res.redirect('/expense');
    } catch (err) {
        console.error("Error saving expense:", err);
        res.status(500).send("Error saving expense.");
    }
};

const expenseUpdateGet = async (req, res) => {
    try {
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
        }

        const expense = await Expense.findById(req.params.id);
        const communities = await Community.find();
        if (!expense) return res.status(404).send('Expense not found');

        res.render('expense/update', { title: 'Update Expense', expense, communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expenseUpdatePost = async (req, res) => {
    try {
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
        }

        console.log("req.body: ", req.body);

        const updatedData = {
            Name: req.body.Name,
            Description: req.body.Description,
            AmountPaid: req.body.AmountPaid,
            Community: req.body.Community,
            PaymentReciept: req.file ? req.file.filename : req.body.PaymentReciept
        };

        await Expense.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.redirect('/expense');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expenseDeleteGet = async (req, res) => {
    try {
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
        }

        const expense = await Expense.findById(req.params.id).populate('Community');
        if (!expense) return res.status(404).send('Expense not found');

        res.render('expense/delete', { title: 'Delete Expense', expense });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expenseDeletePost = async (req, res) => {
    try {
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
        }

        await Expense.findByIdAndDelete(req.params.id);
        res.redirect('/expense');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting expense' });
    }
};

module.exports = {
    expenseIndex,
    expenseCreateGet,
    expenseCreatePost,
    expenseUpdateGet,
    expenseUpdatePost,
    expenseDeleteGet,
    expenseDeletePost
};
