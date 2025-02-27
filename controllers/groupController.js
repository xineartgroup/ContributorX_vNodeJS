const getPool = require('../middleware/sqlconnection');
const sql = require('mssql');

const groupIndex = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const pool = await getPool();
        const resultCountGroups = await pool.request().query('SELECT COUNT(*) AS total FROM Groups');
        const totalGroups = resultCountGroups.recordset[0].total;

        const resultGetGroups = await pool.request().query(`
            SELECT * FROM Groups 
            ORDER BY DateCreated DESC 
            OFFSET ${skip} ROWS 
            FETCH NEXT ${limit} ROWS ONLY
        `);
        const groups = resultGetGroups.recordset;
        for (var i = 0; i < groups.length; i++){
            const result1 = await pool.request()
            .input('Id', sql.Int, groups[i].CommunityId)
            .query("SELECT * FROM communities WHERE Id = @Id");
            groups[i].Community = result1.recordset[0];
        }

        res.render('group/index', { 
            title: 'Group List', 
            groups, 
            currentPage: page,
            totalPages: Math.ceil(totalGroups / limit)
        });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send('Server Error');
    }
};

const groupCreateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM Community');
        const communities = result.recordset;

        res.render('group/create', { title: 'New Group', communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupCreatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description, Community } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('Name', Name)
            .input('Description', Description)
            .input('Community', Community)
            .query('INSERT INTO Groups (Name, Description, Community) VALUES (@Name, @Description, @Community)');
        
        res.redirect('/group');
    } catch (err) {
        console.error("Error saving group:", err);
        res.status(500).send("Error saving group.");
    }
};

const groupUpdateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        const groupResult = await pool.request().input('id', req.params.id).query('SELECT * FROM Groups WHERE id = @id');
        const communitiesResult = await pool.request().query('SELECT * FROM Communities');
        
        const group = groupResult.recordset[0];
        const communities = communitiesResult.recordset;
        if (!group) return res.status(404).send('Group not found');
        
        const result1 = await pool.request()
        .input('Id', sql.Int, group.CommunityId)
        .query("SELECT * FROM communities WHERE Id = @Id");
        group.Community = result1.recordset[0];

        res.render('group/update', { title: 'Update Group', group, communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupUpdatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description, Community } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('id', req.params.id)
            .input('Name', Name)
            .input('Description', Description)
            .input('CommunityId', Community)
            .query('UPDATE Groups SET Name = @Name, Description = @Description, CommunityId = @CommunityId WHERE id = @id');
        
        res.redirect('/group');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupDeleteGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        const result = await pool.request().input('id', req.params.id).query('SELECT * FROM Groups WHERE id = @id');
        const group = result.recordset[0];
        if (!group) return res.status(404).send('Group not found');

        res.render('group/delete', { title: 'Delete Group', group });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupDeletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        await pool.request().input('id', req.params.id).query('DELETE FROM Groups WHERE id = @id');
        res.redirect('/group');
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Error deleting group" });
    }
};

module.exports = {
    groupIndex,
    groupCreateGet,
    groupCreatePost,
    groupUpdateGet,
    groupUpdatePost,
    groupDeleteGet,
    groupDeletePost
};