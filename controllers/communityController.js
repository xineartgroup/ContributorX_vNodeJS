const getPool = require('../middleware/sqlconnection');

const communityIndex = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const pool = await getPool();
        const totalCommunitiesResult = await pool.request().query('SELECT COUNT(*) AS total FROM Communities');
        const totalCommunities = totalCommunitiesResult.recordset[0].total;

        const communitiesResult = await pool.request()
            .query(`SELECT * FROM Communities ORDER BY DateCreated DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`);
        const communities = communitiesResult.recordset;

        res.render('community/index', {
            title: 'Community List', sessionData,
            communities,
            currentPage: page,
            totalPages: Math.ceil(totalCommunities / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const communityCreateGet = (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }
    res.render('community/create', { title: 'New Community' });
};

const communityCreatePost = async (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    const { Name, Description } = req.body;
    try {
        const pool = await getPool();
        await pool.request()
            .input('Name', Name)
            .input('Description', Description)
            .query('INSERT INTO Communities (Name, Description) VALUES (@Name, @Description)');
        res.redirect('/community');
    } catch (err) {
        console.error("Error saving community:", err);
        res.status(500).send("Error saving community.");
    }
};

const communityUpdateGet = async (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
        const pool = await getPool();
        const communityResult = await pool.request()
            .input('id', req.params.id)
            .query('SELECT * FROM Communities WHERE Id = @id');
        const community = communityResult.recordset[0];
        if (!community) return res.status(404).send('Community not found');

        res.render('community/update', { title: 'Update Community', community });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const communityUpdatePost = async (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .input('Name', req.body.Name)
            .input('Description', req.body.Description)
            .query('UPDATE Communities SET Name = @Name, Description = @Description WHERE Id = @id');
        res.redirect('/community');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err);
    }
};

const communityDeleteGet = async (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
        const pool = await getPool();
        const communityResult = await pool.request()
            .input('id', req.params.id)
            .query('SELECT * FROM Communities WHERE Id = @id');
        const community = communityResult.recordset[0];
        if (!community) return res.status(404).send('Community not found');

        res.render('community/delete', { title: 'Delete Community', community });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const communityDeletePost = async (req, res) => {
    if (!req.session?.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .query('DELETE FROM Communities WHERE Id = @id');
        res.redirect('/community');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting community" });
    }
};

module.exports = {
    communityIndex,
    communityCreateGet,
    communityCreatePost,
    communityUpdateGet,
    communityUpdatePost,
    communityDeleteGet,
    communityDeletePost
};