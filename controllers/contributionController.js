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

const getGroupingsForGroup = async (groupId, sessionCookie) => {
    const result = await makeApiRequest('GET', `/grouping/api/bygroup/${groupId}`, sessionCookie);
    if (result.issuccess) {
        return result.groupings;
    } else {
        throw new Error(result.message);
    }
};

const createExpectationAsync = async (expectation, sessionCookie) => {
    const result = await makeApiRequest('POST', `/expectation/api/`, sessionCookie, expectation);
    if (result.issuccess) {
        return result.expectation;
    } else {
        throw new Error(result.message);
    }
};

const fetchTotalContributions = async (sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/contribution/api/count/${session.contributor.CommunityId}/${searchValue}`, sessionCookie);
    if (result.issuccess) {
        return result.totalContributions;
    }else{
        throw new Error(result.message);
    }
}

const fetchContributions = async (skip, limit, sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/contribution/api?communityid=${session.contributor.CommunityId}&skip=${skip}&limit=${limit}&searchValue=${searchValue}`, sessionCookie);
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

        let searchValue = req.query.searchValue != null && req.query.searchValue != '' ? encodeURIComponent(req.query.searchValue) : "*";

        const totalContributions = await fetchTotalContributions(req.headers.cookie, req.session, searchValue);
        const contributions = await fetchContributions(skip, limit, req.headers.cookie, req.session, searchValue);

        searchValue = decodeURIComponent(searchValue);
        if (searchValue == "*") searchValue = "";

        res.render('contribution/index', { 
            title: 'Contribution List', 
            contributions,
            currentPage: page,
            totalPages: Math.ceil(totalContributions / limit),
            searchValue
        });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributionCreateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const groups = await getGroups(req.headers.cookie);
        res.render('contribution/create', { title: 'New Contribution', groups });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributionCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
        
        const { Name, Amount, Group, DueDate } = req.body;
        const result = await makeApiRequest('POST', `/contribution/api/create`, req.headers.cookie, { Name, Amount, Group, DueDate });
        
        if (result.issuccess) {
            const groupings = await getGroupingsForGroup(result.contribution.Group, req.headers.cookie);
            
            for (let i = 0; i < groupings.length; i++) {
                let expectation = {
                    Contributor: groupings[i].ContributorId,
                    Contribution: result.contribution.Id,
                    PaymentStatus: 0, //Utility.PaymentStatus.New
                    AmountPaid: 0.0,
                    AmountToApprove: 0.0
                };
                await createExpectationAsync(expectation, req.headers.cookie);
            }
            
            return res.redirect('/contribution');
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributionUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        let contribution = await fetchContribution(req.params.id, req.headers.cookie);
        let groups = await getGroups(req.headers.cookie);

        return res.render('contribution/update', { title: 'Update Contribution', contribution, groups });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributionUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const { Name, Amount, Group, DueDate } = req.body;

        const result = await makeApiRequest('POST', `/contribution/api/update/${req.params.id}`, req.headers.cookie, { Id: req.params.id, Name, Amount, Group, DueDate });

        if (result.issuccess) {
            return res.redirect('/contribution');
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributionDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        let contribution = await fetchContribution(req.params.id, req.headers.cookie);
        let groups = await getGroups(req.headers.cookie);

        return res.render('contribution/delete', { title: 'Delete Contribution', contribution, groups });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributionDeletePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const result = await makeApiRequest('POST', `/contribution/api/delete/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.redirect('/contribution');
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
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