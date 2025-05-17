const express = require("express");
const { makeApiRequest } = require("./_baseController");
const router = express.Router();

const fetchTotalGroups = async (sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/groups/api/count/${session.contributor.CommunityId}/${searchValue}`, sessionCookie);
    if (result.issuccess) {
        return result.totalGroups;
    }else{
        throw new Error(result.message);
    }
};

const fetchGroups = async (skip, limit, sessionCookie, session, searchValue, sortName, sortOrder) => {
    const result = await makeApiRequest('GET', `/groups/api?communityid=${session.contributor.CommunityId}&skip=${skip}&limit=${limit}&searchValue=${searchValue}&sortName=${sortName}&sortOrder=${sortOrder}`, sessionCookie);
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

        let searchValue = req.query.searchValue != null && req.query.searchValue != '' ? encodeURIComponent(req.query.searchValue) : "*";
        let sortName = req.query.sortName != null && req.query.sortName != '' ? req.query.sortName : "Id";
        let sortOrder = req.query.sortOrder != null && req.query.sortOrder != '' ? req.query.sortOrder : "desc";

        const totalGroups = await fetchTotalGroups(req.headers.cookie, req.session, searchValue);
        const groups = await fetchGroups(skip, limit, req.headers.cookie, req.session, searchValue, sortName, sortOrder);

        searchValue = decodeURIComponent(searchValue);
        if (searchValue == "*") searchValue = "";

        res.render('groups/index', {
            title: 'Group List',
            groups,
            currentPage: page,
            totalPages: Math.ceil(totalGroups / limit),
            searchValue,
            sortName,
            sortOrder
        });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupCreateGet = async (req, res) => {
    try{
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
        return res.render('groups/create', { title: 'New Group', error: null });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description } = req.body;
        const CommunityId = req.session.contributor.CommunityId;

        const result = await makeApiRequest('POST', `/groups/api/`, req.headers.cookie, { Name, Description, CommunityId });

        if (result.issuccess) {
            return res.redirect('/groups');
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/groups/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('groups/update', { title: 'Update Group', group: result.group });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description } = req.body;
        const CommunityId = req.session.contributor.CommunityId;

        const result = await makeApiRequest('POST', `/groups/api/update/${req.params.id}`, req.headers.cookie, { Name, Description, CommunityId });

        if (result.issuccess) {
            return res.redirect('/groups');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/groups/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('groups/delete', { title: 'Delete Group', group: result.group });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupDeletePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('POST', `/groups/api/delete/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.redirect('/groups');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
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
