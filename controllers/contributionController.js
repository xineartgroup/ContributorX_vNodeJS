const { makeApiRequest } = require('./_baseController');
const express = require("express");
const http = require('http');

const router = express.Router();

const fetchGroups = (sessionCookie) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/group/api/all`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            }
        };

        const request = http.request(options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.groups || []);
                } catch (error) {
                    reject("Invalid JSON response");
                }
            });
        });

        request.on('error', (error) => reject("Request error: " + error));
        request.end();
    });
};

async function fetchTotalContributions(sessionCookie) {
    return new Promise((resolve, reject) => {
        const optionsCount = {
            hostname: 'localhost',
            port: 3000,
            path: `/contribution/api/count`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            }
        };

        const request = http.request(optionsCount, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.totalContributions);
                } catch (err) {
                    reject(err);
                }
            });
        });

        request.on('error', (error) => reject(error));
        request.end();
    });
}

async function fetchContributions(skip, limit, sessionCookie) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/contribution/api?skip=${skip}&limit=${limit}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            }
        };

        const request = http.request(options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.contributions);
                } catch (err) {
                    reject(err);
                }
            });
        });

        request.on('error', (error) => reject(error));
        request.end();
    });
}

const fetchContribution = (id, sessionCookie) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/contribution/api/${id}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            }
        };

        const request = http.request(options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.contribution || null);
                } catch (error) {
                    reject("Invalid JSON response");
                }
            });
        });

        request.on('error', (error) => reject("Request error: " + error));
        request.end();
    });
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
    
        const groups = await fetchGroups(req.headers.cookie);
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
        groups = await fetchGroups(req.headers.cookie);
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
        let groups = await fetchGroups(req.headers.cookie);

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
        groups = await fetchGroups(req.headers.cookie);
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
        let groups = await fetchGroups(req.headers.cookie);

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
        groups = await fetchGroups(req.headers.cookie);
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