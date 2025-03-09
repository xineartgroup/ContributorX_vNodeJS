const sql = require('mssql');
const express = require("express");
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

// Get all contributions
router.get("/all", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributions: [] });
        }

        const pool = await getPool();
        const result = await pool.request().query("SELECT * FROM Contributions");
        const contributions = result.recordset;
        res.json({ issuccess: true, message: "", contributions });
    } catch (err) {
        res.status(500).json({ issuccess: false, message: err.message, contributions: [] });
    }
});

router.get('/count/:communityid', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();
        const query = req.params.communityid === 0 ? 'SELECT COUNT(*) AS total FROM Contributions' :
        `SELECT COUNT(c.Id) AS total FROM Contributions c JOIN Groups g ON c.GroupId = g.Id WHERE g.CommunityId = ${req.params.communityid}`;

        const totalContributionsResult = await pool.request().query(query);
        const totalContributions = totalContributionsResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalContributions });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, totalContributions: 0 });
    }
});

router.get('', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributions: [] });
        }

        const skip = req.query.skip;
        const limit = req.query.limit;
        const communityid = req.query.communityid;

        const pool = await getPool();

        const query = !skip || !limit || skip == 0 || limit == 0 
            ? (communityid == 0 ? `SELECT * FROM Contributions ORDER BY Id DESC` : `SELECT c.* FROM Contributions c JOIN Groups g ON c.GroupId = g.Id WHERE g.CommunityId = ${communityid} ORDER BY Id DESC`)
            : (communityid == 0 ? `SELECT * FROM Contributions ORDER BY Id DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY` : `SELECT c.* FROM Contributions c JOIN Groups g ON c.GroupId = g.Id WHERE g.CommunityId = ${communityid} ORDER BY Id DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`);

        const result = await pool.request().query(query);
        let contributions = result.recordset;

        for (var i = 0; i < contributions.length; i++){
            const result1 = await pool.request()
            .input('Id', contributions[i].GroupId)
            .query("SELECT * FROM groups WHERE Id = @Id");
            contributions[i].Group = result1.recordset[0];
        }

        res.json({issuccess: true, message: "", contributions });
    } catch (err) {
        res.json({issuccess: false, message: "Server Error: " + err, contributions: null });
    }
});

router.get('/:id', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contribution: null });
        }

        const pool = await getPool();

        const communityResult = await pool.request()
            .input('Id', req.params.id)
            .query('SELECT * FROM Contributions WHERE Id = @Id');
        const contribution = communityResult.recordset[0];

        if (contribution) {
            const result1 = await pool.request()
            .input('Id', contribution.GroupId)
            .query("SELECT * FROM groups WHERE Id = @Id");
            contribution.Group = result1.recordset[0];
            res.json({ issuccess: true, message: "", contribution });
        } else {
            res.json({ issuccess: false, message: "No contribution with id found", contribution });
        }
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, contribution: null });
    }
});

router.post('/create', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contribution: null });
        }

        const { Name, Amount, Group, DueDate } = req.body;
        const pool = await getPool();
        const newContributionResult = await pool.request()
            .input('Name', Name)
            .input('Amount', Amount)
            .input('Group', Group)
            .input('DateCreated', new Date())
            .input('DueDate', DueDate)
            .query('INSERT INTO Contributions (Name, Amount, GroupId, DateCreated, DueDate) OUTPUT INSERTED.ID VALUES (@Name, @Amount, @Group, @DateCreated, @DueDate)');
        
        const Id = newContributionResult.recordset[0].ID;
        
        res.json({ issuccess: true, message: "", contribution: { Id, Name, Amount, Group, DueDate } });
    } catch (err) {
        const { Name, Amount, Group, DueDate } = req.body;
        res.json({ issuccess: false, message: "Error saving contribution: " + err, contribution: { Id: 0, Name, Amount, Group, DueDate } });
    }
});

router.post('/update/:id', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contribution: null });
        }

        const Id = req.params.id;
        const { Name, Amount, Group, DueDate } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id', Id)
            .input('Name', Name)
            .input('Amount', Amount)
            .input('Group', Group)
            .input('DueDate', DueDate)
            .query('UPDATE Contributions SET Name = @Name, Amount = @Amount, GroupId = @Group, DueDate = @DueDate WHERE Id = @id');
        
        res.json({ issuccess: true, message: "", contribution: { Id, Name, Amount, Group, DueDate } });
    } catch (err) {
        const { Name, Amount, Group, DueDate } = req.body;
        res.json({ issuccess: false, message: "Error saving contribution: " + err, contribution: { Id: req.params.id, Name, Amount, Group, DueDate } });
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contribution: null });
        }

        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .query('DELETE FROM Contributions WHERE Id = @id');
        
        res.json({ issuccess: true, message: "", contribution: null });
    } catch (err) {
        const { Name, Amount, Group, DueDate } = req.body;
        res.json({ issuccess: false, message: "Error deleting contribution: " + err, contribution: { Id: req.params.id, Name, Amount, Group, DueDate } });
    }
});

module.exports = router;