const sql = require('mssql');
const express = require("express");
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

const contributionCount = async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();
        const totalContributionsResult = await pool.request().query('SELECT COUNT(*) AS total FROM Contributions');
        const totalContributions = totalContributionsResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalContributions });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, totalContributions: 0 });
    }
};

const contributionList = async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", contributions: null });
        }
    
        const skip = req.query.skip;
        const limit = req.query.limit;

        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT * FROM Contributions ORDER BY DateCreated DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`);
        
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
};

const contributionItem = async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", communitie: null });
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
};

const contributionCreate = async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
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
        console.error("error: ", err);
        const { Name, Amount, Group, DueDate } = req.body;
        res.json({ issuccess: false, message: "Error saving contribution: " + err, contribution: { Id: 0, Name, Amount, Group, DueDate } });
    }
};

const contributionUpdate = async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
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
};

const contributionDelete = async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
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
};

router.get('/count', contributionCount);
router.get('', contributionList);
router.get('/:id', contributionItem);
router.post('/create', contributionCreate);
router.post('/update/:id', contributionUpdate);
router.post('/delete/:id', contributionDelete);

module.exports = router;