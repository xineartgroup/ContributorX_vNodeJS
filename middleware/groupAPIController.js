const express = require('express');
const getPool = require('../middleware/sqlconnection');
const sql = require('mssql');

const router = express.Router();

const fetchGroups = async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();
        const groupsResult = await pool.request().query('SELECT * FROM Groups');
        let groups = groupsResult.recordset;

        res.json({ issuccess: true, message: "", groups });
    } catch (err) {
        res.json({ issuccess: true, message: "Server Error: " + err, groups: [] });
    }
};

const groupCount = async (req, res) => {
    try {
        const pool = await getPool();
        const totalGroupsResult = await pool.request().query('SELECT COUNT(*) AS total FROM Groups');
        const totalGroups = totalGroupsResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalGroups });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, totalGroups: 0 });
    }
};

const groupList = async (req, res) => {
    try {
        const skip = req.query.skip;
        const limit = req.query.limit;
        const pool = await getPool();

        const query = !skip || !limit || skip == 0 || limit == 0 
            ? `SELECT * FROM Groups ORDER BY DateCreated DESC` 
            : `SELECT * FROM Groups ORDER BY DateCreated DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;

        const groupsResult = await pool.request().query(query);
        const groups = groupsResult.recordset;

        for (let i = 0; i < groups.length; i++) {
            const result = await pool.request()
                .input('Id', sql.Int, groups[i].CommunityId)
                .query("SELECT * FROM Communities WHERE Id = @Id");
            groups[i].Community = result.recordset[0];
        }

        res.json({ issuccess: true, message: "", groups });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, groups: null });
    }
};

const groupItem = async (req, res) => {
    try {
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

            res.json({ issuccess: true, message: "", group });
        } else {
            res.json({ issuccess: false, message: "No group with this ID found", group: null });
        }
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, group: null });
    }
};

const groupCreate = async (req, res) => {
    try {
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
        res.json({ issuccess: true, message: "", group: { Id, Name, Description, Community, DateCreated: date } });
    } catch (err) {
        res.json({ issuccess: false, message: "Error saving group: " + err, group: null });
    }
};

const groupUpdate = async (req, res) => {
    try {
        const { Name, Description, Community } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('Id', req.params.id)
            .input('Name', Name)
            .input('Description', Description)
            .input('CommunityId', Community)
            .query('UPDATE Groups SET Name = @Name, Description = @Description, CommunityId = @CommunityId WHERE Id = @Id');
        
        res.json({ issuccess: true, message: "", group: { Id: req.params.id, Name, Description, Community } });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, group: null });
    }
};

const groupDelete = async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('Id', req.params.id)
            .query('DELETE FROM Groups WHERE Id = @Id');
        
        res.json({ issuccess: true, message: "", group: null });
    } catch (err) {
        res.json({ issuccess: false, message: "Error deleting group: " + err, group: null });
    }
};

router.get('/all', fetchGroups);
router.get('/count', groupCount);
router.get('', groupList);
router.get('/:id', groupItem);
router.post('/', groupCreate);
router.post('/update/:id', groupUpdate);
router.post('/delete/:id', groupDelete);

module.exports = router;