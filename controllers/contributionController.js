const sql = require('mssql');
const sqlConnection = require('../middleware/sqlconnection');

const contributionIndex = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const pool = await sqlConnection();
        const result = await pool.request()
            .query(`SELECT * FROM Contributions ORDER BY DateCreated DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`);
        
        const totalResult = await pool.request().query('SELECT COUNT(*) AS count FROM Contributions');
        const totalContributions = totalResult.recordset[0].count;

        let contributions = result.recordset;

        for (var i = 0; i < contributions.length; i++){
            const result1 = await pool.request()
            .input('Id', contributions[i].GroupId)
            .query("SELECT * FROM groups WHERE Id = @Id");
            contributions[i].Group = result1.recordset[0];
        }

        res.render('contribution/index', { 
            title: 'Contribution List', 
            contributions,
            currentPage: page,
            totalPages: Math.ceil(totalContributions / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionCreateGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const pool = await sqlConnection();
        const groups = await pool.request().query('SELECT * FROM Groups');
        res.render('contribution/create', { title: 'New Contribution', groups: groups.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionCreatePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const { Name, Amount, Group, DueDate } = req.body;
        const pool = await sqlConnection();
        await pool.request()
            .input('Name', sql.NVarChar, Name)
            .input('Amount', sql.Decimal, Amount)
            .input('Group', sql.Int, Group)
            .input('DueDate', sql.Date, DueDate)
            .query('INSERT INTO Contributions (Name, Amount, GroupId, DueDate) VALUES (@Name, @Amount, @Group, @DueDate)');
        
        res.redirect('/contribution');
    } catch (err) {
        console.error("Error saving contribution:", err);
        res.status(500).send("Error saving contribution.");
    }
};

const contributionUpdateGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const pool = await sqlConnection();
        const contributionResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Contributions WHERE Id = @id');
        
        const groupsResult = await pool.request().query('SELECT * FROM Groups');
        if (!contributionResult.recordset.length) return res.status(404).send('Contribution not found');

        let contribution = contributionResult.recordset[0]
        const result1 = await pool.request()
        .input('Id', contribution.GroupId)
        .query("SELECT * FROM groups WHERE Id = @Id");
        contribution.Group = result1.recordset[0];

        let groups = groupsResult.recordset;

        res.render('contribution/update', { title: 'Update Contribution', contribution, groups });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionUpdatePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const { Name, Amount, Group, DueDate } = req.body;
        const pool = await sqlConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('Name', sql.NVarChar, Name)
            .input('Amount', sql.Decimal, Amount)
            .input('Group', sql.Int, Group)
            .input('DueDate', sql.Date, DueDate)
            .query('UPDATE Contributions SET Name = @Name, Amount = @Amount, GroupId = @Group, DueDate = @DueDate WHERE Id = @id');
        
        res.redirect('/contribution');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionDeleteGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const pool = await sqlConnection();
        const contribution = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Contributions WHERE Id = @id');
        
        if (!contribution.recordset.length) return res.status(404).send('Contribution not found');

        res.render('contribution/delete', { title: 'Delete Contribution', contribution: contribution.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionDeletePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
    
        const pool = await sqlConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Contributions WHERE Id = @id');
        
        res.redirect('/contribution');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting contribution" });
    }
};

module.exports = {
    contributionIndex,
    contributionCreateGet,
    contributionCreatePost,
    contributionUpdateGet,
    contributionUpdatePost,
    contributionDeleteGet,
    contributionDeletePost
};