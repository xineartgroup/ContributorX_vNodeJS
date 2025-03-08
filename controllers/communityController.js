const express = require("express");
const { makeApiRequest } = require("./_baseController");

const router = express.Router();

const fetchTotalCommunities = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/community/api/count', sessionCookie);
    if (result.issuccess) {
        return result.totalCommunities;
    } else {
        throw new Error(result.message);
    }
};

const fetchCommunities = async (skip, limit, sessionCookie) => {
    const result = await makeApiRequest('GET', `/community/api?skip=${skip}&limit=${limit}`, sessionCookie);
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
        const sessionCookie = req.headers.cookie;

        const totalCommunities = await fetchTotalCommunities(sessionCookie);
        const communities = await fetchCommunities(skip, limit, sessionCookie);

        res.render('community/index', {
            title: 'Community List',
            communities,
            currentPage: page,
            totalPages: Math.ceil(totalCommunities / limit)
        });
    } catch (error) {
        res.render("community/index", {
            title: 'Community List',
            communities: null,
            currentPage: 0,
            totalPages: 0,
            error: "Error: " + error
        });
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
        res.render("community/create", { title: 'New Community', error: "Error creating community: " + error, communities: [] });
    }
};

// Community Create (POST)
const communityCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        const { Name, Description } = req.body;

        await makeApiRequest('POST', `/community/api/`, sessionCookie, { Name, Description });

        res.redirect('/community');
    } catch (error) {
        res.render("community/create", { title: 'New Community', error: "Error creating community: " + error });
    }
};

// Community Update (GET)
const communityUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        const result = await makeApiRequest('GET', `/community/api/${req.params.id}`, sessionCookie);

        if (result.community) {
            res.render('community/update', { title: 'Update Community', community: result.community });
        } else {
            res.render('community/update', { title: 'Update Community', community: null, error: "Community not found" });
        }
    } catch (error) {
        res.render('community/update', { title: 'Update Community', community: null, error: "Error fetching community: " + error });
    }
};

// Community Update (POST)
const communityUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        const { Name, Description } = req.body;

        await makeApiRequest('POST', `/community/api/update/${req.params.id}`, sessionCookie, { Name, Description });

        res.redirect('/community');
    } catch (error) {
        res.render("community/update", { title: 'Update Community', error: "Error updating community: " + error });
    }
};

// Community Delete (GET)
const communityDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        const result = await makeApiRequest('GET', `/community/api/${req.params.id}`, sessionCookie);

        if (result.community) {
            res.render('community/delete', { title: 'Delete Community', community: result.community });
        } else {
            res.render('community/delete', { title: 'Delete Community', community: null, error: "Community not found" });
        }
    } catch (error) {
        res.render('community/delete', { title: 'Delete Community', community: null, error: "Error fetching community: " + error });
    }
};

// Community Delete (POST)
const communityDeletePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        await makeApiRequest('POST', `/community/api/delete/${req.params.id}`, sessionCookie);

        res.redirect('/community');
    } catch (error) {
        res.render("community/delete", { title: 'Delete Community', error: "Error deleting community: " + error });
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
