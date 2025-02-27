const getPool = require('../middleware/sqlconnection');

const groupingIndex = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const pool = await getPool();
        const totalGroupingsResult = await pool.request().query('SELECT COUNT(*) AS total FROM Grouping');
        const totalGroupings = totalGroupingsResult.recordset[0].total;

        const groupingsResult = await pool.request().query(
            `SELECT g.Id, g.ContributorId, g.GroupId, c.Name AS ContributorName, grp.Name AS GroupName 
             FROM Grouping g 
             JOIN Contributor c ON g.ContributorId = c.Id 
             JOIN GroupTable grp ON g.GroupId = grp.Id 
             ORDER BY g.Id OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`
        );
        const groupings = groupingsResult.recordset;

        res.render('grouping/index', {
            title: 'Grouping List',
            groupings,
            currentPage: page,
            totalPages: Math.ceil(totalGroupings / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupingCreateGet = async (req, res) => {
    try {
        const pool = await getPool();
        const contributorsResult = await pool.request().query('SELECT * FROM Contributor');
        const groupsResult = await pool.request().query('SELECT * FROM GroupTable');

        res.render('grouping/create', {
            title: 'New Grouping',
            contributors: contributorsResult.recordset,
            groups: groupsResult.recordset
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupingCreatePost = async (req, res) => {
    try {
        const { Contributor, Group } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('ContributorId', Contributor)
            .input('GroupId', Group)
            .query('INSERT INTO Grouping (ContributorId, GroupId) VALUES (@ContributorId, @GroupId)');

        res.redirect('/grouping');
    } catch (err) {
        console.error('Error saving grouping:', err);
        res.status(500).send('Error saving grouping.');
    }
};

const groupingUpdateGet = async (req, res) => {
    try {
        const pool = await getPool();
        const groupingResult = await pool.request()
            .input('id', req.params.id)
            .query('SELECT * FROM Grouping WHERE Id = @id');
        const grouping = groupingResult.recordset[0];

        const contributorsResult = await pool.request().query('SELECT * FROM Contributor');
        const groupsResult = await pool.request().query('SELECT * FROM GroupTable');

        if (!grouping) return res.status(404).send('Grouping not found');

        res.render('grouping/update', {
            title: 'Update Grouping',
            grouping,
            contributors: contributorsResult.recordset,
            groups: groupsResult.recordset
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupingUpdatePost = async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .input('ContributorId', req.body.Contributor)
            .input('GroupId', req.body.Group)
            .query('UPDATE Grouping SET ContributorId = @ContributorId, GroupId = @GroupId WHERE Id = @id');

        res.redirect('/grouping');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupingDeleteGet = async (req, res) => {
    try {
        const pool = await getPool();
        const groupingResult = await pool.request()
            .input('id', req.params.id)
            .query(
                `SELECT g.Id, g.ContributorId, g.GroupId, c.Name AS ContributorName, grp.Name AS GroupName 
                 FROM Grouping g 
                 JOIN Contributor c ON g.ContributorId = c.Id 
                 JOIN GroupTable grp ON g.GroupId = grp.Id 
                 WHERE g.Id = @id`
            );
        const grouping = groupingResult.recordset[0];

        if (!grouping) return res.status(404).send('Grouping not found');

        res.render('grouping/delete', { title: 'Delete Grouping', grouping });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupingDeletePost = async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .query('DELETE FROM Grouping WHERE Id = @id');
        res.redirect('/grouping');
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error deleting grouping' });
    }
};

module.exports = {
    groupingIndex,
    groupingCreateGet,
    groupingCreatePost,
    groupingUpdateGet,
    groupingUpdatePost,
    groupingDeleteGet,
    groupingDeletePost
};
