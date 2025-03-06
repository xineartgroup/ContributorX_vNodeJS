const express = require("express");
const { makeApiRequest } = require("./_baseController");
const upload = require('../middleware/upload');
const router = express.Router();

const getCommunities = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/community/api', sessionCookie);
    if (result.issuccess) {
        return result.communities;
    }else{
        throw new Error("Unable to retrieve communities");
    }
};

const fetchTotalContributors = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/contributor/api/count', sessionCookie);
    if (result.issuccess) {
        return result.totalContributors;
    } else {
        throw new Error(result.message);
    }
};

const fetchContributors = async (skip, limit, sessionCookie) => {
    const result = await makeApiRequest('GET', `/contributor/api?skip=${skip}&limit=${limit}`, sessionCookie);
    if (result.issuccess) {
        return result.contributors;
    } else {
        throw new Error(result.message);
    }
};

const contributorIndex = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalContributors = await fetchTotalContributors(req.headers.cookie);
        const contributors = await fetchContributors(skip, limit, req.headers.cookie);

        res.render('contributor/index', {
            title: 'Contributor List',
            contributors,
            currentPage: page,
            totalPages: Math.ceil(totalContributors / limit)
        });
    } catch (err) {
        res.render('contributor/index', {
            title: 'Contributor List',
            contributors: [],
            currentPage: 0,
            totalPages: 0,
            error: "Error: " + err
        });
    }
};

const contributorDetailGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/contributor/api/${req.params.id}`, req.headers.cookie);

        res.render('contributor/detail', { title: 'Contributor Detail', contributor: result.result.contributor, groups: result.result.groups, groupings: result.result.groupings, expectations: result.result.expectations });
    } catch (err) {
        res.status(500).render('contributor/detail', { title: 'Contributor Detail', contributor: [], error: 'Server Error ' + err });
    }
};

const contributorDetailPost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        await makeApiRequest('POST', `/contributor/api/${req.params.id}`, req.headers.cookie, req.body);
        res.redirect('/contributor');
    } catch (err) {
        res.status(500).render('contributor/', { title: 'Contributor Detail', contributor: [], error: 'Server Error ' + err });
    }
};

const contributorCreateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
        
        const communities = await getCommunities();

        res.render('contributor/create', { title: 'New Contributor', communities });
    } catch (err) {
        res.status(500).render('contributor/', { title: 'New Contributor', communities: [], error: 'Server Error ' + err });
    }
};

const contributorCreatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        await makeApiRequest('POST', '/contributor/api', req.headers.cookie, req.body);
        res.redirect('/contributor');
    } catch (err) {
        res.status(500).render('contributor/detail', { title: 'New Contributor', communities: [], error: 'Server Error ' + err });
    }
};

const contributorUpdateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/contributor/api/${req.params.id}`, req.headers.cookie);
        res.render('contributor/update', { title: 'Update Contributor', contributor: result.result.contributor });
    } catch (err) {
        res.status(500).render('contributor/update', { title: 'Update Contributor', contributor: null, error: 'Server Error ' + err });
    }
};

const contributorUpdatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        await makeApiRequest('POST', `/contributor/api/update/${req.params.id}`, req.headers.cookie, req.body);
        res.redirect('/contributor');
    } catch (err) {
        res.status(500).render('contributor/update', { title: 'Update Contributor', contributor: null, error: 'Server Error ' + err });
    }
};

const contributorDeleteGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/contributor/api/${req.params.id}`, req.headers.cookie);
        
        res.render('contributor/delete', { title: 'Delete Contributor', contributor: result.result.contributor });
    } catch (err) {
        res.render('contributor/delete', { title: 'Delete Contributor', contributor: null, error: 'Server Error ' + err });
    }
};

const contributorDeletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        await makeApiRequest('POST', `/contributor/api/delete/${req.params.id}`, req.headers.cookie);
        res.redirect('/contributor');
    } catch (err) {
        res.render('contributor/delete', { title: 'Delete Contributor', contributor: null, error: 'Server Error ' + err });
    }
};

router.get('', contributorIndex);
router.get('/detail/:id', contributorDetailGet);
router.post('/detail/:id', contributorDetailPost);
router.get('/create', contributorCreateGet);
router.post('/', upload.single("PaymentReciept"), contributorCreatePost);
router.get('/update/:id', contributorUpdateGet);
router.post('/update/:id', upload.single("PaymentReciept"), contributorUpdatePost);
router.get('/delete/:id', contributorDeleteGet);
router.post('/delete/:id', contributorDeletePost);

module.exports = router;