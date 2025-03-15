const express = require("express");
const { makeApiRequest } = require("./_baseController");
const upload = require('./upload');
const router = express.Router();

const fetchTotalContributors = async (sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/contributor/api/count/${session.contributor.CommunityId}/${searchValue}`, sessionCookie);
    if (result.issuccess) {
        return result.totalContributors;
    } else {
        throw new Error(result.message);
    }
};

const fetchContributors = async (skip, limit, sessionCookie, session, searchValue) => {
    const result = await makeApiRequest('GET', `/contributor/api?communityid=${session.contributor.CommunityId}&skip=${skip}&limit=${limit}&searchValue=${searchValue}`, sessionCookie);
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

        let searchValue = req.query.searchValue != null && req.query.searchValue != '' ? encodeURIComponent(req.query.searchValue) : "*";

        const totalContributors = await fetchTotalContributors(req.headers.cookie, req.session, searchValue);
        const contributors = await fetchContributors(skip, limit, req.headers.cookie, req.session, searchValue);

        searchValue = decodeURIComponent(searchValue);
        if (searchValue == "*") searchValue = "";

        return res.render('contributor/index', {
            title: 'Contributor List',
            contributors,
            currentPage: page,
            totalPages: Math.ceil(totalContributors / limit),
            searchValue
        });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributorDetailGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/contributor/api/${req.params.id}`, req.headers.cookie);

        if (result.issuccess) {
            return res.render('contributor/detail', { title: 'Contributor Detail', contributor: result.contributor, groups: result.groups, groupings: result.groupings, expectations: result.expectations });
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributorDetailPost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('POST', `/contributor/api/${req.params.id}`, req.headers.cookie, req.body);

        if (result.issuccess) {
            return res.redirect('/contributor');
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributorCreateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
        
        return res.render('contributor/create', { title: 'New Contributor' });
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributorCreatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, IsActive } = req.body;
        Community = req.session.contributor.CommunityId;

        const result = await makeApiRequest('POST', '/contributor/api', req.headers.cookie, { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Community, IsActive });
        
        if (result.issuccess) {
            return res.redirect('/contributor');
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributorUpdateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/contributor/api/${req.params.id}`, req.headers.cookie);
        
        if (result.issuccess) {
            return res.render('contributor/update', { title: 'Update Contributor', contributor: result.contributor });
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributorUpdatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, IsActive } = req.body;
        Community = req.session.contributor.CommunityId;

        const result = await makeApiRequest('POST', `/contributor/api/update/${req.params.id}`, req.headers.cookie, { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Community, IsActive });
        
        if (result.issuccess) {
            return res.redirect('/');
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributorDeleteGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('GET', `/contributor/api/${req.params.id}`, req.headers.cookie);
        
        if (result.issuccess) {
            return res.render('contributor/delete', { title: 'Delete Contributor', contributor: result.contributor });
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const contributorDeletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const result = await makeApiRequest('POST', `/contributor/api/delete/${req.params.id}`, req.headers.cookie);
        
        if (result.issuccess) {
            return res.redirect('/contributor');
        }else{
            return res.render('error', { title: 'Error', detail: result.message });
        }
    } catch (error) {
        return res.render('error', { title: 'Error', detail: error });
    }
};

const changePasswordGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        res.render('contributor/changepassword', { title: 'Change Password' });
    } catch (error) {
        return res.render("contributor/changepassword", { title: 'Change Password', error: "Login error: " + error });
    }
};

const changePasswordPost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const { PasswordOld, PasswordNew, PasswordConfirm } = req.body;

        const result = await makeApiRequest('POST', `/contributor/api/changepassword/${req.session.contributor.Id}`, req.headers.cookie, { PasswordOld, PasswordNew, PasswordConfirm });

        if (result.issuccess) {
            res.redirect("/");
        } else {
            console.log("error: ", result.message);
            return res.render("contributor/changepassword", { title: 'Change Password', error: result.message });
        }
    } catch (error) {
        return res.render("contributor/changepassword", { title: 'Change Password', error: "Login error: " + error });
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
router.get("/changepassword", changePasswordGet);
router.post("/changepassword", changePasswordPost);

module.exports = router;