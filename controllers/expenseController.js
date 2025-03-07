const express = require("express");
const { makeApiRequest } = require("./_baseController");
const upload = require('./upload');
const router = express.Router();

const getCommunities = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/community/api', sessionCookie);
    if (result.issuccess) {
        return result.communities;
    } else {
        throw new Error(result.message);
    }
};

const fetchTotalExpenses = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/expense/api/count', sessionCookie);
    if (result.issuccess) {
        return result.totalExpenses;
    } else {
        throw new Error(result.message);
    }
};

const fetchExpenses = async (skip, limit, sessionCookie) => {
    const result = await makeApiRequest('GET', `/expense/api?skip=${skip}&limit=${limit}`, sessionCookie);
    if (result.issuccess) {
        return result.expenses;
    } else {
        throw new Error(result.message);
    }
};

const expenseIndex = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalExpenses = await fetchTotalExpenses(req.headers.cookie);
        const expenses = await fetchExpenses(skip, limit, req.headers.cookie);

        return res.render('expense/index', {
            title: 'Expense List',
            expenses,
            currentPage: page,
            totalPages: Math.ceil(totalExpenses / limit)
        });
    } catch (error) {
        return res.render("expense/index", {
            title: 'Expense List',
            expenses: [],
            currentPage: 0,
            totalPages: 0,
            error: "Error: " + error
        });
    }
};

const expenseCreateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const communities = await getCommunities();
        return res.render('expense/create', { title: 'New Expense', error: null, communities });
    } catch (error) {
        return res.render("expense/create", { title: 'New Expense', error: "Error creating expense: " + error, communities: [] });
    }
};

const expenseCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description, AmountPaid, Community } = req.body;
        const DateCreated = new Date();
        const PaymentReciept = req.file ? req.file.filename : '';

        const result = await makeApiRequest('POST', `/expense/api/`, req.headers.cookie, { Name, Description, DateCreated, AmountPaid, Community, PaymentReciept });
        const communities = await getCommunities();

        if (result.issuccess) {
            return res.redirect('/expense');
        } else {
            return res.render('expense/create', { title: 'Create Expense', error: result.message, communities });
        }
    } catch (error) {
        return res.render("expense/create", { title: 'New Expense', error: "Error creating expense: " + error, communities: [] });
    }
};

const expenseUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expense/api/${req.params.id}`, req.headers.cookie);
        const communities = await getCommunities();

        if (result.issuccess) {
            return res.render('expense/update', { title: 'Update Expense', expense: result.expense, communities });
        } else {
            return res.render('expense/update', { title: 'Update Expense', expense: null, error: "Expense not found", communities });
        }
    } catch (error) {
        return res.render('expense/update', { title: 'Update Expense', expense: null, error: "Error fetching expense: " + error, communities: [] });
    }
};

const expenseUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description, AmountPaid, Community } = req.body;
        const PaymentReciept = req.file ? req.file.filename : req.body.PaymentReciept || '';

        const result = await makeApiRequest('POST', `/expense/api/update/${req.params.id}`, req.headers.cookie, {
            Name, Description, AmountPaid, Community, PaymentReciept
        });
        const communities = await getCommunities();

        if (result.issuccess) {
            return res.redirect('/expense');
        } else {
            return res.render('expense/create', { title: 'Create Expense', error: result.message, communities });
        }
    } catch (error) {
        return res.render("expense/update", { title: 'Update Expense', error: "Error updating expense: " + error, communities: [] });
    }
};

const expenseDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expense/api/${req.params.id}`, req.headers.cookie);

        if (result.expense) {
            return res.render('expense/delete', { title: 'Delete Expense', expense: result.expense });
        } else {
            return res.render('expense/delete', { title: 'Delete Expense', expense: null, error: "Expense not found" });
        }
    } catch (error) {
        return res.render('expense/delete', { title: 'Delete Expense', expense: null, error: "Error fetching expense: " + error });
    }
};

const expenseDeletePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('POST', `/expense/api/delete/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.redirect('/expense');
        } else {
            return res.render('expense/delete', { title: 'Delete Expense', expense: null, error: "Expense not found" });
        }
    } catch (error) {
        return res.render("expense/delete", { title: 'Delete Expense', error: "Error deleting expense: " + error });
    }
};

router.get('', expenseIndex);
router.get('/create', expenseCreateGet);
router.post('/', upload.single("PaymentReciept"), expenseCreatePost);
router.get('/update/:id', expenseUpdateGet);
router.post('/update/:id', upload.single("PaymentReciept"), expenseUpdatePost);
router.get('/delete/:id', expenseDeleteGet);
router.post('/delete/:id', expenseDeletePost);

module.exports = router;
