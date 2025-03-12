const sql = require('mssql');
const express = require("express");
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

router.get('/count/:communityid/:searchValue', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();
        let query = req.params.communityid === 0 ? 'SELECT COUNT(c.Id) AS total FROM Contributions c' :
        `SELECT COUNT(c.Id) AS total FROM Contributions c JOIN Groups g ON c.GroupId = g.Id WHERE g.CommunityId = ${req.params.communityid}`;

        if (req.params.searchValue != "*")
        {
            if (query.includes(" WHERE "))
                query = query + ` AND c.Name LIKE '%${req.params.searchValue}%' OR g.Name LIKE '%${req.params.searchValue}%'`;
            else
                query = query + ` WHERE c.Name LIKE '%${req.params.searchValue}%' OR g.Name LIKE '%${req.params.searchValue}%'`;
        }

        const totalContributionsResult = await pool.request().query(query);
        const totalContributions = totalContributionsResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalContributions });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, totalContributions: 0 });
    }
});

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

router.get('', async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributions: [] });
        }

        const skip = req.query.skip;
        const limit = req.query.limit;
        const communityid = req.query.communityid;
        const searchValue = req.query.searchValue;

        const pool = await getPool();

        let query = "SELECT c.* FROM Contributions c JOIN Groups g ON c.GroupId = g.Id";
        
        if (communityid == 0){
            query = query + ` WHERE g.CommunityId = ${communityid}`;
        }

        if (searchValue && searchValue === "*") {
        }else{
            if (query.includes(" WHERE "))
                query = query + ` AND c.Name LIKE '%${searchValue}%' OR g.Name LIKE '%${searchValue}%'`;
            else
                query = query + ` WHERE c.Name LIKE '%${searchValue}%' OR g.Name LIKE '%${searchValue}%'`;
        }

        query = query + " ORDER BY c.Id DESC";

        if (skip && limit && skip != 0 && limit != 0){
            query = query + ` OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;
        }

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