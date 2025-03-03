const express = require('express');
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

const communityCount = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            //res.json({ issuccess: false, message: "User not authorized", communities: null });
        }

        const pool = await getPool();
        const totalCommunitiesResult = await pool.request().query('SELECT COUNT(*) AS total FROM Communities');
        const totalCommunities = totalCommunitiesResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalCommunities });
    } catch (err) {
        res.status(500).json({ issuccess: true, message: "Server Error: " + err, communities: null });
    }
};

const communityList = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            //res.json({ issuccess: false, message: "User not authorized", communities: null });
        }

        const skip = req.query.skip;
        const limit = req.query.limit;

        const pool = await getPool();

        const query = !skip || !limit || skip == 0 || limit == 0 ? `SELECT * FROM Communities ORDER BY Name ASC`
        : `SELECT * FROM Communities ORDER BY DateCreated DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;

        const communitiesResult = await pool.request().query(query);
        const communities = communitiesResult.recordset;

        res.json({ issuccess: true, message: "", communities });
    } catch (err) {
        res.status(500).json({ issuccess: true, message: "Server Error: " + err, communities: null });
    }
};

const communityItem = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            //res.json({ issuccess: false, message: "User not authorized", communities: null });
        }

        const pool = await getPool();

        const communityResult = await pool.request()
            .input('Id', req.params.id)
            .query('SELECT * FROM Communities WHERE Id = @Id');
        const community = communityResult.recordset[0];

        if (community) {
            res.json({ issuccess: true, message: "", community });
        } else {
            res.json({ issuccess: false, message: "No community with id found", community });
        }
    } catch (err) {
        res.status(500).json({ issuccess: true, message: "Server Error: " + err, communities: null });
    }
};

const communityCreate = async (req, res) => {
    try {
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            //res.json({ issuccess: false, message: "User not authorized", communities: null });
        }

        const date = new Date();
        const { Name, Description } = req.body;

        const pool = await getPool();
        newCommunityResult = await pool.request()
            .input('Name', Name)
            .input('Description', Description)
            .input('DateCreated', date)
            .query('INSERT INTO Communities (Name, Description, DateCreated) OUTPUT INSERTED.ID VALUES (@Name, @Description, @DateCreated)');
        
        Id = newCommunityResult.recordset[0].ID;
        
        res.json({ issuccess: true, message: "", communities: { Id, Name, Description, date } });
    } catch (err) {
        res.status(500).json({ issuccess: false, message: "Error saving community. " + err, communities: { Id, Name, Description, date } });
    }
};

const communityUpdate = async (req, res) => {
    try {
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            //res.json({ issuccess: false, message: "User not authorized", communities: null });
        }

        const Id = req.params.id;
        const { Name, Description, date } = req.body;

        const pool = await getPool();
        await pool.request()
            .input('id', Id)
            .input('Name', Name)
            .input('Description', Description)
            .query('UPDATE Communities SET Name = @Name, Description = @Description WHERE Id = @id');
        
        res.json({ issuccess: true, message: "", communities: { Id, Name, Description, date } });
    } catch (err) {
        res.status(500).send('Server Error: ' + err);
    }
};

const communityDelete = async (req, res) => {
    const sessionData = req.session;

    if (!sessionData || !req.session.isLoggedIn) {
        //res.json({ issuccess: false, message: "User not authorized", communities: null });
    }

    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .query('DELETE FROM Communities WHERE Id = @id');
        res.redirect('/community');
    } catch (err) {
        res.status(500).json({ error: "Error deleting community" });
    }
};

router.get('/count', communityCount);
router.get('', communityList);
router.get('/:id', communityItem);
router.post('/', communityCreate);
router.post('/update/:id', communityUpdate);
router.post('/delete/:id', communityDelete);

module.exports = router;