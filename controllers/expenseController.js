const express = require("express");
const { makeApiRequest } = require("./_baseController");
const upload = require('./upload');
const router = express.Router();

const fetchTotalExpenses = async (sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/expenses/api/count/${session.contributor.CommunityId}/${searchValue}`, sessionCookie);
    if (result.issuccess) {
        return result.totalExpenses;
    } else {
        throw new Error(result.message);
    }
};

const fetchExpenses = async (skip, limit, sessionCookie, session, searchValue, sortName, sortOrder) => {
    const result = await makeApiRequest('GET', `/expenses/api?communityid=${session.contributor.CommunityId}&skip=${skip}&limit=${limit}&searchValue=${searchValue}&sortName=${sortName}&sortOrder=${sortOrder}`, sessionCookie);
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

        let searchValue = req.query.searchValue != null && req.query.searchValue != '' ? encodeURIComponent(req.query.searchValue) : "*";
        let sortName = req.query.sortName != null && req.query.sortName != '' ? req.query.sortName : "Id";
        let sortOrder = req.query.sortOrder != null && req.query.sortOrder != '' ? req.query.sortOrder : "desc";

        const totalExpenses = await fetchTotalExpenses(req.headers.cookie, req.session, searchValue);
        const expenses = await fetchExpenses(skip, limit, req.headers.cookie, req.session, searchValue, sortName, sortOrder);

        searchValue = decodeURIComponent(searchValue);
        if (searchValue == "*") searchValue = "";

        return res.render('expenses/index', {
            title: 'Expense List',
            expenses,
            currentPage: page,
            totalPages: Math.ceil(totalExpenses / limit),
            searchValue,
            sortName,
            sortOrder
        });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expenseCreateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        return res.render('expenses/create', { title: 'New Expense', error: null });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expenseCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description, AmountPaid } = req.body;
        const CommunityId = req.session.contributor.CommunityId;
        const PaymentReceipt = req.file ? req.file.filename : '';
        const DateCreated = new Date();

        const result = await makeApiRequest('POST', `/expenses/api/`, req.headers.cookie, {
            Name, Description, DateCreated, AmountPaid, CommunityId, PaymentReceipt
        });

        if (result.issuccess) {
            return res.redirect('/expenses');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expenseUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expenses/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('expenses/update', { title: 'Update Expense', expense: result.expense });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expenseUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description, AmountPaid } = req.body;
        const CommunityId = req.session.contributor.CommunityId;
        const PaymentReceipt = req.file ? req.file.filename : req.body.PaymentReceipt || '';

        const result = await makeApiRequest('POST', `/expenses/api/update/${req.params.id}`, req.headers.cookie, {
            Name, Description, AmountPaid, CommunityId, PaymentReceipt
        });

        if (result.issuccess) {
            return res.redirect('/expenses');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expenseDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expenses/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('expenses/delete', { title: 'Delete Expense', expense: result.expense });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expenseDeletePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('POST', `/expenses/api/delete/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.redirect('/expenses');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

router.get('', expenseIndex);
router.get('/create', expenseCreateGet);
router.post('/', upload.single("PaymentReceipt"), expenseCreatePost);
router.get('/update/:id', expenseUpdateGet);
router.post('/update/:id', upload.single("PaymentReceipt"), expenseUpdatePost);
router.get('/delete/:id', expenseDeleteGet);
router.post('/delete/:id', expenseDeletePost);

module.exports = router;
