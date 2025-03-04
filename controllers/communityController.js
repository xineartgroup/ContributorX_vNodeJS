const express = require("express");
const http = require('http');

const router = express.Router();

async function fetchTotalCommunities() {
    return new Promise((resolve, reject) => {
        const optionsCount = {
            hostname: 'localhost',
            port: 3000,
            path: `/community/api/count`,
            method: 'GET'
        };

        const request = http.request(optionsCount, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.totalCommunities);
                } catch (err) {
                    reject(err);
                }
            });
        });

        request.on('error', (error) => reject(error));
        request.end();
    });
}

async function fetchCommunities(skip, limit) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/community/api?skip=${skip}&limit=${limit}`,
            method: 'GET'
        };

        const request = http.request(options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.communities);
                } catch (err) {
                    reject(err);
                }
            });
        });

        request.on('error', (error) => reject(error));
        request.end();
    });
}

const communityIndex = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalCommunities = await fetchTotalCommunities();
        const communities = await fetchCommunities(skip, limit);

        res.render('community/index', {
            title: 'Community List',
            communities,
            currentPage: page,
            totalPages: Math.ceil(totalCommunities / limit)
        });
    } catch (error) {
        console.error("Error:", error);
        res.render("community/index", {
            title: 'Community List',
            communities: null,
            currentPage: 0,
            totalPages: 0,
            error: "Error: " + error
        });
    }
};

const communityCreateGet = (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }
    res.render('community/create', { title: 'New Community' });
};

const communityCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description } = req.body;
        const reqData = JSON.stringify({
            Name: Name,
            Description: Description
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/community/api/`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(reqData)
            }
        };

        const request = http.request(options, (response) => {
            let data = '';
        
            response.on('data', (chunk) => {
                data += chunk;
            });
        
            response.on('end', () => {
                const result = JSON.parse(data);
    
                res.redirect('/community');
            });
        });
        
        request.on('error', (error) => {
            res.render("community/create", {
                title: 'New Community',
                error: "Request error: " + error
            });
        });
        
        request.write(reqData);
        request.end();
    } catch (error) {
        console.error("Error:", error);
        res.render("community/create", {
            title: 'New Community',
            error: "Request error: " + error
        });
    }
};

const communityUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/community/api/${req.params.id}`,
            method: 'GET'
        };

        const request = http.request(options, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                const result = JSON.parse(data);
                community = result.community;
                if (community){
                    res.render('community/update', { title: 'Update Community', community });
                } else {
                    res.render('community/update', { title: 'Update Community', community, error: "Community not found" });
                }
            });
        });
        
        request.on('error', (error) => {
            res.render('community/update', { title: 'Update Community', community, error: "Request error: " + error });
        });
        
        request.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const communityUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description } = req.body;
        const reqData = JSON.stringify({
            Name: Name,
            Description: Description
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/community/api/update/${req.params.id}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(reqData)
            }
        };

        const request = http.request(options, (response) => {
            let data = '';
        
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                const result = JSON.parse(data);
    
                res.redirect('/community');
            });
        });
        
        request.on('error', (error) => {
            res.render("community/update", {
                title: 'New Community',
                error: "Request error: " + error
            });
        });
        
        request.write(reqData);
        request.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err);
    }
};

const communityDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/community/api/${req.params.id}`,
            method: 'GET'
        };

        const request = http.request(options, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                const result = JSON.parse(data);
                community = result.community;
                if (community){
                    res.render('community/delete', { title: 'Delete Community', community });
                } else {
                    res.render('community/delete', { title: 'Delete Community', community, error: "Community not found" });
                }
            });
        });
        
        request.on('error', (error) => {
            res.render('community/delete', { title: 'Delete Community', community, error: "Request error: " + error });
        });
        
        request.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const communityDeletePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description } = req.body;
        const reqData = JSON.stringify({
            Name: Name,
            Description: Description
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/community/api/delete/${req.params.id}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(reqData)
            }
        };

        const request = http.request(options, (response) => {
            let data = '';
        
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                res.redirect('/community');
            });
        });
        
        request.on('error', (error) => {
            res.render("community/delete", {
                title: 'New Community',
                error: "Request error: " + error
            });
        });
        
        request.write(reqData);
        request.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting community" });
    }
};

router.get('', communityIndex);
router.get('/create', communityCreateGet);
router.post('/', communityCreatePost);
router.get('/update/:id', communityUpdateGet);
router.post('/update/:id', communityUpdatePost);
router.get('/delete/:id', communityDeleteGet);
router.post('/delete/:id', communityDeletePost);

module.exports = router;