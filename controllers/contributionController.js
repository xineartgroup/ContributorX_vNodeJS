const express = require("express");
const { makeApiRequest } = require('./_baseController');

const router = express.Router();

const getGroups = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/group/api/all', sessionCookie);
    if (result.issuccess) {
        return result.groups;
    } else {
        throw new Error(result.message);
    }
};

const fetchTotalContributions = async (sessionCookie) => {
    const result = await makeApiRequest('GET', '/contribution/api/count', sessionCookie);
    if (result.issuccess) {
        return result.totalContributions;
    }else{
        throw new Error(result.message);
    }
}

const fetchContributions = async (skip, limit, sessionCookie) => {
    const result = await makeApiRequest('GET', `/contribution/api?skip=${skip}&limit=${limit}`, sessionCookie);
    if (result.issuccess) {
        return result.contributions;
    }else{
        throw new Error(result.message);
    }
}

const fetchContribution = async (id, sessionCookie) => {
    const result = await makeApiRequest('GET', `/contribution/api/${id}`, sessionCookie);
    if (result.issuccess) {
        return result.contribution;
    }else{
        throw new Error(result.message);
    }
};

const contributionIndex = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalContributions = await fetchTotalContributions(req.headers.cookie);
        const contributions = await fetchContributions(skip, limit, req.headers.cookie);

        res.render('contribution/index', { 
            title: 'Contribution List', 
            contributions,
            currentPage: page,
            totalPages: Math.ceil(totalContributions / limit)
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const contributionCreateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const groups = await getGroups(req.headers.cookie);
        res.render('contribution/create', { title: 'New Contribution', groups });
    } catch (err) {
        res.render('contribution/create', { title: 'New Contribution', contribution: null, groups: [], error: "Server Error" + err });
    }
};

const contributionCreatePost = async (req, res) => {
    let groups = [];
    let contribution = null;

    try{
        const { Name, Amount, Group, DueDate } = req.body;
        contribution = { Id: req.params.id, Name, Amount, Group, DueDate };
        groups = await getGroups(req.headers.cookie);
    }catch{}

    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const { Name, Amount, Group, DueDate } = req.body;
        const result = await makeApiRequest('POST', `/contribution/api/create`, req.headers.cookie, { Name, Amount, Group, DueDate });

        if (result.issuccess) {
            res.redirect('/contribution');
        }else{
            return res.render('contribution/create', { title: 'Create Contribution', contribution, groups, error: result.message });
        }
    } catch (err) {
        res.render('contribution/create', { title: 'Create Contribution', contribution: null, groups: [], error: "Server Error" + err });
    }
};

const contributionUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        let contribution = await fetchContribution(req.params.id, req.headers.cookie);
        let groups = await getGroups(req.headers.cookie);

        if (contribution) {
            res.render('contribution/update', { title: 'Update Contribution', contribution, groups });
        }else{
            res.render('contribution/update', { title: 'Update Contribution', contribution: null, groups, error: "Contribution not found" });
        }
    } catch (err) {
        res.render('contribution/update', { title: 'Update Contribution', contribution: null, groups: [], error: "Server Error" + err });
    }
};

const contributionUpdatePost = async (req, res) => {
    let groups = [];
    let contribution = null;

    try{
        const { Name, Amount, Group, DueDate } = req.body;
        contribution = { Id: req.params.id, Name, Amount, Group, DueDate };
        groups = await getGroups(req.headers.cookie);
    }catch{}

    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const result = await makeApiRequest('POST', `/contribution/api/update/${req.params.id}`, req.headers.cookie, contribution);

        if (result.issuccess) {
            res.redirect('/contribution');
        }else{
            res.render('contribution/update', { title: 'Update Contribution', contribution, groups, error: result.message });
        }
    } catch (err) {
        res.render('contribution/update', { title: 'Update Contribution', contribution, groups, error: "Server Error" });
    }
};

const contributionDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        let contribution = await fetchContribution(req.params.id, req.headers.cookie);
        let groups = await getGroups(req.headers.cookie);

        if (contribution) {
            res.render('contribution/delete', { title: 'Delete Contribution', contribution, groups });
        }else{
            res.render('contribution/delete', { title: 'Delete Contribution', contribution: null, groups, error: "Contribution not found" });
        }
    } catch (err) {
        res.render('contribution/delete', { title: 'Delete Contribution', contribution: null, groups: [], error: "Server Error" + err });
    }
};

const contributionDeletePost = async (req, res) => {
    let groups = [];
    let contribution = null;

    try{
        const { Name, Amount, Group, DueDate } = req.body;
        contribution = { Id: req.params.id, Name, Amount, Group, DueDate };
        groups = await getGroups(req.headers.cookie);
    }catch{}

    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const result = await makeApiRequest('POST', `/contribution/api/delete/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            res.redirect('/contribution');
        }else{
            res.render('contribution/delete', { title: 'Update Contribution', contribution, groups, error: result.message });
        }
    } catch (err) {
        res.render('contribution/delete', { title: 'Update Contribution', contribution, groups, error: "Error deleting contribution. ", err });
    }
};

router.get('', contributionIndex);
router.get('/create', contributionCreateGet);
router.post('/', contributionCreatePost);
router.get('/update/:id', contributionUpdateGet);
router.post('/update/:id', contributionUpdatePost);
router.get('/delete/:id', contributionDeleteGet);
router.post('/delete/:id', contributionDeletePost);

module.exports = router;