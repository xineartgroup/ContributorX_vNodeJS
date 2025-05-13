const express = require('express');
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

router.get('/count/:communityid/:searchValue', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            //return res.json({ issuccess: false, message: "User not authorized", totalCommunities: 0 });
        }

        const pool = await getPool();
        let query = req.params.communityid === 0 ? 'SELECT COUNT(*) AS total FROM Communities' :
        `SELECT COUNT(*) AS total FROM Communities`; // WHERE Id = ${req.params.communityid}

        if (req.params.searchValue != "*")
        {
            if (query.includes(" WHERE "))
                query = query + ` AND Name LIKE '%${req.params.searchValue}%' OR Description LIKE '%${req.params.searchValue}%'`;
            else
                query = query + ` WHERE Name LIKE '%${req.params.searchValue}%' OR Description LIKE '%${req.params.searchValue}%'`;
        }

        const totalCommunitiesResult = await pool.request().query('SELECT COUNT(*) AS total FROM Communities');
        const totalCommunities = totalCommunitiesResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalCommunities });
    } catch (err) {
        res.json({ issuccess: true, message: "Server Error: " + err, totalCommunities: 0 });
    }
});

router.get('/getbyname/:name', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            //return res.json({ issuccess: false, message: "User not authorized", community: null });
        }

        const pool = await getPool();

        const communityResult = await pool.request()
            .input('Name', req.params.name)
            .query('SELECT * FROM Communities WHERE Name = @Name');
        const community = communityResult.recordset.length > 0 ? communityResult.recordset[0] : null;

        if (community) {
            res.json({ issuccess: true, message: "", community });
        } else {
            res.json({ issuccess: false, message: "No community with id found", community });
        }
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, community: null });
    }
});

router.get('', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            //return res.json({ issuccess: false, message: "User not authorized", communities: [] });
        }

        const skip = req.query.skip;
        const limit = req.query.limit;
        const searchValue = req.query.searchValue || '';

        const pool = await getPool();

        let query = "SELECT * FROM Communities";
        
        if (searchValue && searchValue !== "*") {
            if (query.includes(" WHERE ")) {
                query += " AND (Name LIKE @search OR Description LIKE @search)";
                pool.request().input("search", `%${searchValue}%`);
            }
            else {
                query += " WHERE (Name LIKE @search OR Description LIKE @search)";
                pool.request().input("search", `%${searchValue}%`);
            }
        }

        query = query + " ORDER BY Id DESC";

        if (skip && limit){
            query += " OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY";
            pool.request().input("skip", parseInt(skip));
            pool.request().input("limit", parseInt(limit));
        }

        console.log(query);

        const communitiesResult = await pool.request().query(query);
        const communities = communitiesResult.recordset;

        res.json({ issuccess: true, message: "", communities });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, communities: null });
    }
});

router.get('/:id', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            //return res.json({ issuccess: false, message: "User not authorized", community: null });
        }

        const pool = await getPool();

        const communityResult = await pool.request()
            .input('Id', req.params.id)
            .query('SELECT * FROM Communities WHERE Id = @Id');
        const community = communityResult.recordset.length > 0 ? communityResult.recordset[0] : null;

        if (community) {
            res.json({ issuccess: true, message: "", community });
        } else {
            res.json({ issuccess: false, message: "No community with id found", community });
        }
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, community: null });
    }
});

router.post('/', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            //return res.json({ issuccess: false, message: "User not authorized", community: null });
        }

        const date = new Date();
        const { Name, Description } = req.body;

        const pool = await getPool();
        const newCommunityResult = await pool.request()
            .input('Name', Name)
            .input('Description', Description)
            .input('DateCreated', date)
            .query('INSERT INTO Communities (Name, Description, DateCreated) OUTPUT INSERTED.ID VALUES (@Name, @Description, @DateCreated)');
        
        const Id = newCommunityResult.recordset.length > 0 ? newCommunityResult.recordset[0].ID : 0;
        
        res.json({ issuccess: true, message: "", community: { Id, Name, Description, date } });
    } catch (err) {
        res.json({ issuccess: false, message: "Error saving community. " + err, community: null });
    }
});

router.post('/update/:id', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", community: null });
        }

        const Id = req.params.id;
        const { Name, Description, date } = req.body;

        const pool = await getPool();
        await pool.request()
            .input('id', Id)
            .input('Name', Name)
            .input('Description', Description)
            .query('UPDATE Communities SET Name = @Name, Description = @Description WHERE Id = @id');
        
        res.json({ issuccess: true, message: "", community: { Id, Name, Description, date } });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, community: null });
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", community: null });
        }

        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .query('DELETE FROM Communities WHERE Id = @id');
            
        res.json({ issuccess: true, message: "", community: null });
    } catch (err) {
        res.json({ issuccess: false, message: "Error deleting community" + err, community: null });
    }
});

module.exports = router;