const express = require("express");
const { makeApiRequest } = require("./_baseController");

const router = express.Router();

// Community Count (Get)
const fetchTotalCommunities = async (sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/community/api/count/${session.contributor.CommunityId}/${searchValue}`, sessionCookie);
    if (result.issuccess) {
        return result.totalCommunities;
    } else {
        throw new Error(result.message);
    }
};

// Community List (List)
const fetchCommunities = async (skip, limit, sessionCookie, session, searchValue, sortName, sortOrder) => {
    const result = await makeApiRequest('GET', `/community/api?communityid=${session.contributor.CommunityId}&skip=${skip}&limit=${limit}&searchValue=${searchValue}&sortName=${sortName}&sortOrder=${sortOrder}`, sessionCookie);
    if (result.issuccess) {
        return result.communities;
    } else {
        throw new Error(result.message);
    }
};

// Community Index (List)
const communityIndex = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        let searchValue = req.query.searchValue != null && req.query.searchValue != '' ? encodeURIComponent(req.query.searchValue) : "*";
        let sortName = req.query.sortName != null && req.query.sortName != '' ? req.query.sortName : "e.Id";
        let sortOrder = req.query.sortOrder != null && req.query.sortOrder != '' ? req.query.sortOrder : "desc";

        const totalCommunities = await fetchTotalCommunities(req.headers.cookie, req.session, searchValue);
        const communities = await fetchCommunities(skip, limit, req.headers.cookie, req.session, searchValue, sortName, sortOrder);

        searchValue = decodeURIComponent(searchValue);
        if (searchValue == "*") searchValue = "";

        res.render('community/index', {
            title: 'Community List',
            communities,
            currentPage: page,
            totalPages: Math.ceil(totalCommunities / limit),
            searchValue,
            sortName,
            sortOrder
        });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

// Community Create (GET)
const communityCreateGet = (req, res) => {
    try{
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
        res.render('community/create', { title: 'New Community' });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

// Community Create (POST)
const communityCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description } = req.body;

        const result = await makeApiRequest('POST', `/community/api/`, req.headers.cookie, { Name, Description });

        if (result.issuccess) {
            return res.redirect('/community');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

// Community Update (GET)
const communityUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/community/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('community/update', { title: 'Update Community', community: result.community });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

// Community Update (POST)
const communityUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description } = req.body;

        const result = await makeApiRequest('POST', `/community/api/update/${req.params.id}`, req.headers.cookie, { Name, Description });

        if (result.issuccess) {
            return res.redirect('/');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

// Community Delete (GET)
const communityDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/community/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('community/delete', { title: 'Delete Community', community: result.community });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

// Community Delete (POST)
const communityDeletePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('POST', `/community/api/delete/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.redirect('/community');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

// Routes
router.get('', communityIndex);
router.get('/create', communityCreateGet);
router.post('/', communityCreatePost);
router.get('/update/:id', communityUpdateGet);
router.post('/update/:id', communityUpdatePost);
router.get('/delete/:id', communityDeleteGet);
router.post('/delete/:id', communityDeletePost);

module.exports = router;
