const express = require("express");
const { makeApiRequest } = require("./_baseController");
const router = express.Router();

const fetchTotalGroups = async (sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/group/api/count/${session.contributor.CommunityId}/${searchValue}`, sessionCookie);
    if (result.issuccess) {
        return result.totalGroups;
    }else{
        throw new Error(result.message);
    }
};

const fetchGroups = async (skip, limit, sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/group/api?communityid=${session.contributor.CommunityId}&skip=${skip}&limit=${limit}&searchValue=${searchValue}`, sessionCookie);
    if (result.issuccess) {
        return result.groups;
    }else{
        throw new Error(result.message);
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

        const searchValue = req.query.searchValue != null && req.query.searchValue != '' ? encodeURIComponent(req.query.searchValue) : "*";

        const totalGroups = await fetchTotalGroups(req.headers.cookie, req.session, searchValue);
        const groups = await fetchGroups(skip, limit, req.headers.cookie, req.session, searchValue);

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
    try{
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
        res.render('group/create', { title: 'New Group', error: null });
    } catch (error) {
        res.render("group/create", { title: 'New Group', error: "Error creating group: " + error });
    }
};

const groupCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description } = req.body;
        const Community = req.session.contributor.CommunityId;

        const result = await makeApiRequest('POST', `/group/api/`, req.headers.cookie, { Name, Description, Community });

        if (result.issuccess) {
            res.redirect('/group');
        }else{
            return res.render('group/create', { title: 'Create Group', error: result.message });
        }
    } catch (error) {
        res.render("group/create", { title: 'New Group', error: "Error creating group: " + error });
    }
};

const groupUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/group/api/${req.params.id}`, req.headers.cookie);

        if (result.group) {
            res.render('group/update', { title: 'Update Group', group: result.group });
        } else {
            res.render('group/update', { title: 'Update Group', group: null, error: "Group not found" });
        }
    } catch (error) {
        res.render('group/update', { title: 'Update Group', group: null, error: "Error fetching group: " + error });
    }
};

const groupUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description } = req.body;
        const Community = req.session.contributor.CommunityId;

        await makeApiRequest('POST', `/group/api/update/${req.params.id}`, req.headers.cookie, { Name, Description, Community });

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

        const result = await makeApiRequest('GET', `/group/api/${req.params.id}`, req.headers.cookie);

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

        await makeApiRequest('POST', `/group/api/delete/${req.params.id}`, req.headers.cookie);

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
