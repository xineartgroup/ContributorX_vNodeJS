const express = require("express");
const http = require('http');
const getPool = require('../middleware/sqlconnection');

const communityIndex = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const pool = await getPool();
        const totalCommunitiesResult = await pool.request().query('SELECT COUNT(*) AS total FROM Communities');
        const totalCommunities = totalCommunitiesResult.recordset[0].total;
        
        try {
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
                    const result = JSON.parse(data);
                    
                    res.render('community/index', {
                        title: 'Community List', sessionData,
                        communities: result.communities,
                        currentPage: page,
                        totalPages: Math.ceil(totalCommunities / limit)
                    });
                });
            });
            
            request.on('error', (error) => {
                res.render("community/index", {
                    title: 'Community List', sessionData,
                    communities: null,
                    currentPage: 0,
                    totalPages: 0,
                    error: "Request error: " + error
                });
            });
            
            request.end();
        } catch (error) {
            console.error("Error:", error);
            res.render("community/index", {
                title: 'Community List', sessionData,
                communities: null,
                currentPage: 0,
                totalPages: 0,
                error: "Error: " + error
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const communityCreateGet = (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }
    res.render('community/create', { title: 'New Community' });
};

const communityCreatePost = async (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    const { Name, Description } = req.body;
    const reqData = JSON.stringify({
        Name: Name,
        Description: Description
    });
    try {

        try {
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
                    title: 'New Community', sessionData,
                    error: "Request error: " + error
                });
            });
            
            request.write(reqData);
            request.end();
        } catch (error) {
            console.error("Error:", error);
            res.render("community/create", {
                title: 'New Community', sessionData,
                error: "Request error: " + error
            });
        }
    } catch (err) {
        console.error("Error saving community: ", err);
        res.status(500).send("Error saving community.");
    }
};

const communityUpdateGet = async (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
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
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .input('Name', req.body.Name)
            .input('Description', req.body.Description)
            .query('UPDATE Communities SET Name = @Name, Description = @Description WHERE Id = @id');
        res.redirect('/community');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err);
    }
};

const communityDeleteGet = async (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
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
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .query('DELETE FROM Communities WHERE Id = @id');
        res.redirect('/community');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting community" });
    }
};

module.exports = {
    communityIndex,
    communityCreateGet,
    communityCreatePost,
    communityUpdateGet,
    communityUpdatePost,
    communityDeleteGet,
    communityDeletePost
};