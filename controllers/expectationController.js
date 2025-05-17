const express = require("express");
const { makeApiRequest } = require("./_baseController");
const upload = require('./upload');

const router = express.Router();

const getContributors = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/contributors/api/all', sessionCookie);
    if (result.issuccess) {
        return result.contributors;
    }else{
        throw new Error(result.message);
    }
};

const getContributions = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/contributions/api/all', sessionCookie);
    if (result.issuccess) {
        return result.contributions;
    }else{
        throw new Error(result.message);
    }
};

const fetchTotalExpectations = async (sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/expectations/api/count/${session.contributor.CommunityId}/${searchValue}`, sessionCookie);
    if (result.issuccess) {
        return result.totalExpectations;
    }else{
        throw new Error(result.message);
    }
};

const fetchExpectations = async (skip, limit, sessionCookie, session, searchValue, sortName, sortOrder) => {
    const result = await makeApiRequest('GET', `/expectations/api?communityid=${session.contributor.CommunityId}&skip=${skip}&limit=${limit}&searchValue=${searchValue}&sortName=${sortName}&sortOrder=${sortOrder}`, sessionCookie);
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
        
        let searchValue = req.query.searchValue != null && req.query.searchValue != '' ? encodeURIComponent(req.query.searchValue) : "*";
        let sortName = req.query.sortName != null && req.query.sortName != '' ? req.query.sortName : "e.Id";
        let sortOrder = req.query.sortOrder != null && req.query.sortOrder != '' ? req.query.sortOrder : "desc";

        const totalExpectations = await fetchTotalExpectations(req.headers.cookie, req.session, searchValue);
        const expectations = await fetchExpectations(skip, limit, req.headers.cookie, req.session, searchValue, sortName, sortOrder);

        searchValue = decodeURIComponent(searchValue);
        if (searchValue == "*") searchValue = "";

        res.render('expectations/index', {
            title: 'Expectation List',
            expectations,
            currentPage: page,
            totalPages: Math.ceil(totalExpectations / limit),
            searchValue,
            sortName,
            sortOrder
        });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expectationCreateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const contributors = await getContributors(req.headers.cookie);
        const contributions = await getContributions(req.headers.cookie);
        
        res.render('expectations/create', { title: 'New Expectation', contributors, contributions });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expectationCreatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const { ContributorId, ContributionId, AmountPaid, AmountToApprove, PaymentStatus } = req.body;
        const PaymentReceipt = req.file ? req.file.filename : null;
        
        const result = await makeApiRequest('POST', `/expectations/api/`, req.headers.cookie, { ContributorId, ContributionId, AmountPaid, AmountToApprove, PaymentStatus, PaymentReceipt });

        if (result.issuccess) {
            return res.redirect('/expectations');
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expectationUpdateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const result = await makeApiRequest('GET', `/expectations/api/${req.params.id}`, req.headers.cookie);
        const contributors = await getContributors(req.headers.cookie);
        const contributions = await getContributions(req.headers.cookie);

        if (result.issuccess) {
            return res.render('expectations/update', { title: 'Update Expectation', expectation: result.expectation, contributors, contributions });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expectationUpdatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const { ContributorId, ContributionId, AmountPaid, AmountToApprove, PaymentStatus } = req.body;
        const PaymentReceipt = req.file ? req.file.filename : req.body.PaymentReceipt;
        
        const result = await makeApiRequest('POST', `/expectations/api/update/${req.params.id}`, req.headers.cookie, { ContributorId, ContributionId, AmountPaid, AmountToApprove, PaymentStatus, PaymentReceipt });
        
        if (result.issuccess) {
            return res.redirect('s');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expectationDeleteGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const result = await makeApiRequest('GET', `/expectations/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('expectations/delete', { title: 'Delete Expectation', expectation });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expectationDeletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const result = await makeApiRequest('POST', `/expectations/api/delete/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.redirect('/expectations');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expectationPaymentGet = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expectations/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('expectations/makePayment', { title: 'Make Payment', expectation: result.expectation });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const expectationPaymentPost = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('POST', `/expectations/api/payment/${req.params.id}`, req.headers.cookie, req.body);

        if (result.issuccess) {
            return res.redirect('/');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const paymentApproval = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expectations/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('expectations/paymentApproval', { title: 'Approve Payment', expectation: result.expectation });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const paymentApprove = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expectations/api/paymentapprove/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.redirect("/expectations");
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const paymentReject = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/expectations/api/paymentreject/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.redirect("/expectations");
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const paymentWriteOff = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('POST', `/expectations/api/delete/${req.params.id}`, req.headers.cookie); //const result = await makeApiRequest('GET', `/expectations/api/paymentwriteoff/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.redirect("/expectations");
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const paymentReport = async (req, res) => {
    if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');

    const contributor = req.session.contributor;
    if (!contributor) {
        return res.render('error', { title: 'Error', detail: "No contributor found in session." });
    }

    const result = await makeApiRequest('GET', `/expectations/api/getbycontributor/${contributor.Id}/*`, req.headers.cookie);

    console.log("Result: ", result);

    res.render('expectations/paymentReport', { title: 'My Payment Report', expectations: result.expectations });
};

const paymentReportAll = async (req, res) => {
    if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');

    const expectations = await fetchExpectations(0, 1000000000, req.headers.cookie, req.session, '', 'e.Id', 'asc');

    res.render('expectations/paymentReportAll', { title: 'Payment Report', expectations });
};

router.get('', expectationIndex);
router.get('/create', expectationCreateGet);
router.post('/', expectationCreatePost);
router.get('/update/:id', expectationUpdateGet);
router.post('/update/:id', expectationUpdatePost);
router.get('/delete/:id', expectationDeleteGet);
router.post('/delete/:id', expectationDeletePost);
router.get('/payment/:id', expectationPaymentGet);
router.post('/payment/:id', upload.single("PaymentReceipt"), expectationPaymentPost);
router.get('/paymentApproval/:id', paymentApproval);
router.get('/paymentapprove/:id', paymentApprove);
router.get('/paymentreject/:id', paymentReject);
router.get('/paymentwriteoff/:id', paymentWriteOff);
router.get('/paymentReport', paymentReport);
router.get('/paymentReportAll', paymentReportAll);

module.exports = router;
