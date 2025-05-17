const express = require("express");
const { makeApiRequest } = require("./_baseController");
const upload = require('./upload');
const router = express.Router();

const getContributors = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/contributors/api/all', sessionCookie);
    if (result.issuccess) {
        return result.contributors;
    } else {
        throw new Error(result.message);
    }
};

const getGroups = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/groups/api/all', sessionCookie);
    if (result.issuccess) {
        return result.groups;
    } else {
        throw new Error(result.message);
    }
};

const fetchTotalGroups = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/groups/api/count/0', sessionCookie);
    if (result.issuccess) {
        return result.totalGroups;
    } else {
        throw new Error(result.message);
    }
};

const fetchGroups = async (skip, limit, sessionCookie) => {
    const result = await makeApiRequest('GET', `/groups/api?skip=${skip}&limit=${limit}`, sessionCookie);
    if (result.issuccess) {
        return result.groups;
    } else {
        throw new Error(result.message);
    }
};

const groupingIndex = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalGroupings = await fetchTotalGroups(req.headers.cookie);
        const groupings = await fetchGroups(skip, limit, req.headers.cookie);

        return res.render('grouping/index', {
            title: 'Grouping List',
            groupings,
            currentPage: page,
            totalPages: Math.ceil(totalGroupings / limit)
        });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupingCreateGet = async (req, res) => {
    try {
        const contributors = await getContributors(req.headers.cookie);
        const groups = await getGroups(req.headers.cookie);

        return res.render('grouping/create', { title: 'New Grouping', contributors, groups });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupingCreatePost = async (req, res) => {
    try {
        const { ContributorId, GroupId } = req.body;

        const result = await makeApiRequest('POST', `/grouping/api/`, req.headers.cookie, { ContributorId, GroupId });

        if (result.issuccess) {
            return res.redirect('/grouping');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupingUpdateGet = async (req, res) => {
    try {
        const result = await makeApiRequest('GET', `/grouping/api/${req.params.id}`, req.headers.cookie);

        const contributors = await getContributors(req.headers.cookie);
        const groups = await getGroups(req.headers.cookie);

        if (result.issuccess){
            return res.render('grouping/update', { title: 'Update Grouping', grouping, contributors, groups });
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupingUpdatePost = async (req, res) => {
    try {
        const { ContributorId, GroupId } = req.body;

        const result = await makeApiRequest('POST', `/expenses/api/update/${req.params.id}`, req.headers.cookie, {
            ContributorId, GroupId
        });
        
        if (result.issuccess) {
            return res.redirect('/grouping');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupingDeleteGet = async (req, res) => {
    try {
        const result = await makeApiRequest('GET', `/grouping/api/${req.params.id}`, req.headers.cookie);

        if (result.expense) {
            return res.render('grouping/delete', { title: 'Delete Grouping', grouping });
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const groupingDeletePost = async (req, res) => {
    try {
        const result = await makeApiRequest('POST', `/grouping/api/delete/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            res.redirect('/grouping');
        } else {
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

router.get('', groupingIndex);
router.get('/create', groupingCreateGet);
router.post('/', groupingCreatePost);
router.get('/update/:id', groupingUpdateGet);
router.post('/update/:id', groupingUpdatePost);
router.get('/delete/:id', groupingDeleteGet);
router.post('/delete/:id', groupingDeletePost);

module.exports = router;