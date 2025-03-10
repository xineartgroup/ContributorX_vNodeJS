const express = require('express');
const getPool = require('../middleware/sqlconnection');
const sql = require('mssql');

const router = express.Router();

router.get('/all', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", groups: [] });
        }

        const pool = await getPool();
        const groupsResult = await pool.request().query('SELECT * FROM Groups');
        let groups = groupsResult.recordset;

        return res.json({ issuccess: true, message: "", groups });
    } catch (err) {
        return res.json({ issuccess: false, message: "Server Error: " + err, groups: [] });
    }
});

router.get('', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", groups: [] });
        }

        const skip = req.query.skip;
        const limit = req.query.limit;
        const communityid = req.query.communityid;
        const searchValue = req.query.searchValue;
        
        const pool = await getPool();

        let query = "SELECT * FROM Groups";
        
        if (communityid == 0){
            query = query + ` WHERE communityid = ${communityid}`;
        }

        if (searchValue && searchValue === "*") {
        }else{
            if (query.includes(" WHERE "))
                query = query + ` AND Name LIKE '%${searchValue}%' OR Description LIKE '%${searchValue}%'`;
            else
                query = query + ` WHERE Name LIKE '%${searchValue}%' OR Description LIKE '%${searchValue}%'`;
        }

        query = query + " ORDER BY Id DESC";

        if (skip && limit && skip != 0 && limit != 0){
            query = query + ` OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;
        }

        const groupsResult = await pool.request().query(query);
        const groups = groupsResult.recordset;

        for (let i = 0; i < groups.length; i++) {
            const result = await pool.request()
                .input('Id', sql.Int, groups[i].CommunityId)
                .query("SELECT * FROM Communities WHERE Id = @Id");
            groups[i].Community = result.recordset[0];
        }

        return res.json({ issuccess: true, message: "", groups });
    } catch (err) {
        return res.json({ issuccess: false, message: "Server Error: " + err, groups: [] });
    }
});

router.get('/count/:communityid/:searchValue', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", totalGroups: 0 });
        }

        const pool = await getPool();
        let query = req.params.communityid === 0 ? 'SELECT COUNT(*) AS total FROM Groups' :
        `SELECT COUNT(*) AS total FROM Groups WHERE CommunityId = ${req.params.communityid}`;

        if (req.params.searchValue != "*")
        {
            if (query.includes(" WHERE "))
                query = query + ` AND Name LIKE '%${req.params.searchValue}%' OR Description LIKE '%${req.params.searchValue}%'`;
            else
                query = query + ` WHERE Name LIKE '%${req.params.searchValue}%' OR Description LIKE '%${req.params.searchValue}%'`;
        }

        const totalGroupsResult = await pool.request().query(query);
        const totalGroups = totalGroupsResult.recordset[0].total;

        return res.json({ issuccess: true, message: "", totalGroups });
    } catch (err) {
        return res.json({ issuccess: false, message: "Server Error: " + err, totalGroups: 0 });
    }
});

router.get('/:id', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", group: null });
        }

        const pool = await getPool();
        const groupResult = await pool.request()
            .input('Id', req.params.id)
            .query('SELECT * FROM Groups WHERE Id = @Id');
        const group = groupResult.recordset[0];

        if (group) {
            const communityResult = await pool.request()
                .input('Id', sql.Int, group.CommunityId)
                .query("SELECT * FROM Communities WHERE Id = @Id");
            group.Community = communityResult.recordset[0];

            return res.json({ issuccess: true, message: "", group });
        } else {
            return res.json({ issuccess: false, message: "No group with this ID found", group: null });
        }
    } catch (err) {
        return res.json({ issuccess: false, message: "Server Error: " + err, group: null });
    }
});

router.post('/', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", group: null });
        }

        const { Name, Description, Community } = req.body;
        const pool = await getPool();
        const date = new Date();
        
        const newGroupResult = await pool.request()
            .input('Name', Name)
            .input('Description', Description)
            .input('CommunityId', Community)
            .input('DateCreated', date)
            .query('INSERT INTO Groups (Name, Description, CommunityId, DateCreated) OUTPUT INSERTED.ID VALUES (@Name, @Description, @CommunityId, @DateCreated)');
        
        const Id = newGroupResult.recordset[0].ID;
        return res.json({ issuccess: true, message: "", group: { Id, Name, Description, Community, DateCreated: date } });
    } catch (err) {
        return res.json({ issuccess: false, message: "Error saving group: " + err, group: null });
    }
});

router.post('/update/:id', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", group: null });
        }

        const { Name, Description, Community } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('Id', req.params.id)
            .input('Name', Name)
            .input('Description', Description)
            .input('CommunityId', Community)
            .query('UPDATE Groups SET Name = @Name, Description = @Description, CommunityId = @CommunityId WHERE Id = @Id');
        
        return res.json({ issuccess: true, message: "", group: { Id: req.params.id, Name, Description, Community } });
    } catch (err) {
        return res.json({ issuccess: false, message: "Server Error: " + err, group: null });
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", group: null });
        }

        const pool = await getPool();
        await pool.request()
            .input('Id', req.params.id)
            .query('DELETE FROM Groups WHERE Id = @Id');
        
        return res.json({ issuccess: true, message: "", group: null });
    } catch (err) {
        return res.json({ issuccess: false, message: "Error deleting group: " + err, group: null });
    }
});

module.exports = router;