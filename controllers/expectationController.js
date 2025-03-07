const express = require("express");
const { makeApiRequest } = require("./_baseController");
const upload = require('./upload');

const router = express.Router();

const getContributors = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/contributor/api/all', sessionCookie);
    if (result.issuccess) {
        return result.contributors;
    }else{
        throw new Error(result.message);
    }
};

const getContributions = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/contribution/api/all', sessionCookie);
    if (result.issuccess) {
        return result.contributions;
    }else{
        throw new Error(result.message);
    }
};

const fetchTotalExpectations = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/expectation/api/count', sessionCookie);
    if (result.issuccess) {
        return result.totalExpectations;
    }else{
        throw new Error(result.message);
    }
};

const fetchExpectations = async (skip, limit, sessionCookie) => {
    const result = await makeApiRequest('GET', `/expectation/api?skip=${skip}&limit=${limit}`, sessionCookie);
    if (result.issuccess) {
        return result.expectations;
    }else{
        throw new Error(result.message);
    }
};

const expectationIndex = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        
        const totalExpectations = await fetchTotalExpectations(req.headers.cookie);
        const expectations = await fetchExpectations(skip, limit, req.headers.cookie);

        res.render('expectation/index', {
            title: 'Expectation List',
            expectations,
            currentPage: page,
            totalPages: Math.ceil(totalExpectations / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('expectation/index', {
            title: 'Expectation List',
            expectations: [],
            currentPage: 0,
            totalPages: 0
        });
    }
};

const expectationCreateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const contributors = await getContributors(req.headers.cookie);
        const contributions = await getContributions(req.headers.cookie);
        
        res.render('expectation/create', { title: 'New Expectation', contributors, contributions });
    } catch (err) {
        console.error(err);
        res.status(500).render('expectation/create', { title: 'New Expectation', contributors: [], contributions: [] });
    }
};

const expectationCreatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const { Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus } = req.body;
        const PaymentReciept = req.file ? req.file.filename : null;
        
        const result = await makeApiRequest('POST', `/expectation/api/`, req.headers.cookie, { Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus, PaymentReciept });
        const contributors = await getContributors(req.headers.cookie);
        const contributions = await getContributions(req.headers.cookie);

        if (result.issuccess) {
            res.redirect('/expectation');
        }else{
            return res.render('expectation/create', { title: 'Create Expectation', error: result.message, contributors, contributions });
        }
    } catch (err) {
        console.error("Error saving expectation:", err);
        res.status(500).render('expectation/create', { title: 'New Expectation', contributors: [], contributions: [] });
    }
};

const expectationUpdateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const result = await makeApiRequest('GET', `/expectation/api/${req.params.id}`, req.headers.cookie);
        const contributors = await getContributors(req.headers.cookie);
        const contributions = await getContributions(req.headers.cookie);

        if (result.expectation) {
            res.render('expectation/update', { title: 'Update Expectation', expectation: result.expectation, contributors, contributions });
        } else {
            res.render('expectation/update', { title: 'Update Expectation', expectation: null, error: "Expectation not found", contributors, contributions });
        }
    } catch (err) {
        console.error(err);
        res.status(500).render('expectation/update', { title: 'Update Expectation', expectation: null, error: err, contributors: [], contributions: [] });
    }
};

const expectationUpdatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const { Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus } = req.body;
        const PaymentReciept = req.file ? req.file.filename : req.body.PaymentReciept;
        
        await makeApiRequest('POST', `/expectation/api/update/${req.params.id}`, req.headers.cookie, { Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus, PaymentReciept });
        
        res.redirect('/expectation');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationDeleteGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const result = await makeApiRequest('GET', `/expectation/api/${req.params.id}`, req.headers.cookie);

        if (result.expectation) {
            res.render('expectation/delete', { title: 'Delete Expectation', expectation });
        } else {
            res.render('expectation/delete', { title: 'Delete Expectation', expectation: null, error: "Expectation not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).render('expectation/delete', { title: 'Delete Expectation', expectation: null, error: err });
    }
};

const expectationDeletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        await makeApiRequest('POST', `/expectation/api/delete/${req.params.id}`, req.headers.cookie);

        res.redirect('/expectation');
    } catch (err) {
        console.error(err);
        res.status(500).render('expectation/delete', { title: 'Delete Expectation', expectation: null, error: err });
    }
};

const expectationPaymentGet = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expectation/api/${req.params.id}`, req.headers.cookie);

        if (result.expectation) {
            return res.render('expectation/makePayment', { title: 'Make Payment', expectation });
        } else {
            return res.render('expectation/makePayment', { title: 'Make Payment', expectation: null, error: "Expectation not found" });
        }
    } catch (err) {
        console.error("Error fetching expectation:", err);
        return res.status(500).render('expectation/makePayment', { title: 'Make Payment', expectation: null, error: "Expectation not found" });
    }
};

const expectationPaymentPost = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        await makeApiRequest('POST', `/expectation/api/payment/${req.params.id}`, req.headers.cookie, req.body);

        return res.redirect('/');

    } catch (err) {
        console.error("Error processing payment:", err);
        return res.status(500).send("Server error.");
    }
};

const paymentApproval = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expectation/api/${req.params.id}`, req.headers.cookie);

        if (result.expectation) {
            return res.render('expectation/paymentApproval', { title: 'Approve Payment', expectation });
        } else {
            return res.render('expectation/paymentApproval', { title: 'Approve Payment', expectation: null, error: "Expectation not found" });
        }
    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).render('expectation/paymentApproval', { title: 'Approve Payment', expectation: null, error: error });
    }
};

const paymentApprove = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        await makeApiRequest('GET', `/expectation/api/paymentapprove/${req.params.id}`, req.headers.cookie);

        return res.redirect("/expectation");

    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).send("Server error.");
    }
};

const paymentReject = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        await makeApiRequest('GET', `/expectation/api/paymentreject/${req.params.id}`, req.headers.cookie);

        return res.redirect("/expectation");

    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).send("Server error.");
    }
};

const paymentWriteOff = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        await makeApiRequest('GET', `/expectation/api/paymentwriteoff/${req.params.id}`, req.headers.cookie);

        return res.redirect("/expectation");

    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).send("Server error.");
    }
};

router.get('', expectationIndex);
router.get('/create', expectationCreateGet);
router.post('/', expectationCreatePost);
router.get('/update/:id', expectationUpdateGet);
router.post('/update/:id', expectationUpdatePost);
router.get('/delete/:id', expectationDeleteGet);
router.post('/delete/:id', expectationDeletePost);
router.get('/payment/:id', expectationPaymentGet);
router.post('/payment/:id', upload.single("PaymentReciept"), expectationPaymentPost);
router.get('/paymentApproval/:id', paymentApproval);
router.get('/paymentapprove/:id', paymentApprove);
router.get('/paymentreject/:id', paymentReject);
router.get('/paymentwriteoff/:id', paymentWriteOff);

module.exports = router;
