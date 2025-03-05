const express = require("express");
const { makeApiRequest } = require("./_baseController");
const router = express.Router();

const getCommunities = async (sessionCookie) => {
    try {
        const result = await makeApiRequest('GET', '/community/api', sessionCookie);
        if (!result.issuccess) {
            throw new Error("Unable to retrieve communities");
        }
        return result.communities;
    } catch (error) {
        throw new Error("Error fetching communities: " + error);
    }
};

const fetchTotalGroups = async (sessionCookie) => {
    try {
        const result = await makeApiRequest('GET', '/group/api/count', sessionCookie);
        return result.totalGroups;
    } catch (error) {
        throw new Error("Error fetching total groups: " + error);
    }
};

const fetchGroups = async (skip, limit, sessionCookie) => {
    try {
        const result = await makeApiRequest('GET', `/group/api?skip=${skip}&limit=${limit}`, sessionCookie);
        return result.groups;
    } catch (error) {
        throw new Error("Error fetching groups: " + error);
    }
};

const groupIndex = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const sessionCookie = req.headers.cookie;

        const totalGroups = await fetchTotalGroups(sessionCookie);
        const groups = await fetchGroups(skip, limit, sessionCookie);

        res.render('group/index', {
            title: 'Group List',
            groups,
            currentPage: page,
            totalPages: Math.ceil(totalGroups / limit)
        });
    } catch (error) {
        res.render("group/index", {
            title: 'Group List',
            groups: null,
            currentPage: 0,
            totalPages: 0,
            error: "Error: " + error
        });
    }
};

const groupCreateGet = async (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }
    const communities = await getCommunities();
    res.render('group/create', { title: 'New Group', error: null, communities });
};

const groupCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        const { Name, Description, Community } = req.body;

        const result = await makeApiRequest('POST', `/group/api/`, sessionCookie, { Name, Description, Community });
        const communities = await getCommunities();

        if (result.issuccess) {
            res.redirect('/group');
        }else{
            return res.render('group/create', { title: 'Create Group', error: result.message, communities });
        }
    } catch (error) {
        const communities = await getCommunities();
        res.render("group/create", { title: 'New Group', error: "Error creating group: " + error, communities });
    }
};

const groupUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        const result = await makeApiRequest('GET', `/group/api/${req.params.id}`, sessionCookie);
        const communities = await getCommunities();

        if (result.group) {
            res.render('group/update', { title: 'Update Group', group: result.group, communities });
        } else {
            res.render('group/update', { title: 'Update Group', group: null, error: "Group not found", communities });
        }
    } catch (error) {
        const communities = await getCommunities();
        res.render('group/update', { title: 'Update Group', group: null, error: "Error fetching group: " + error, communities });
    }
};

const groupUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        const { Name, Description, Community } = req.body;

        await makeApiRequest('POST', `/group/api/update/${req.params.id}`, sessionCookie, { Name, Description, Community });

        res.redirect('/group');
    } catch (error) {
        res.render("group/update", { title: 'Update Group', error: "Error updating group: " + error });
    }
};

const groupDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        const result = await makeApiRequest('GET', `/group/api/${req.params.id}`, sessionCookie);

        if (result.group) {
            res.render('group/delete', { title: 'Delete Group', group: result.group });
        } else {
            res.render('group/delete', { title: 'Delete Group', group: null, error: "Group not found" });
        }
    } catch (error) {
        res.render('group/delete', { title: 'Delete Group', group: null, error: "Error fetching group: " + error });
    }
};

const groupDeletePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const sessionCookie = req.headers.cookie;
        await makeApiRequest('POST', `/group/api/delete/${req.params.id}`, sessionCookie);

        res.redirect('/group');
    } catch (error) {
        res.render("group/delete", { title: 'Delete Group', error: "Error deleting group: " + error });
    }
};

router.get('', groupIndex);
router.get('/create', groupCreateGet);
router.post('/', groupCreatePost);
router.get('/update/:id', groupUpdateGet);
router.post('/update/:id', groupUpdatePost);
router.get('/delete/:id', groupDeleteGet);
router.post('/delete/:id', groupDeletePost);

module.exports = router;
