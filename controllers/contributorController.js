const getPool = require('../middleware/sqlconnection');

const contributorIndex = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Get DB connection
        const pool = await getPool();

        // Get total count of contributors
        const resultTotal = await pool.request().query("SELECT COUNT(*) AS count FROM Contributors");
        const resultContributors = await pool.request().query("SELECT * FROM Contributors");

        const totalContributors = resultTotal.recordset[0].count;
        const contributors = resultContributors.recordset;

        for (var i = 0; i < contributors.length; i++){
            const resultExpectations = await pool.request()
                .input('contributorId', contributors[i].Id)
                .query("SELECT * FROM Expectations WHERE ContributorId = @contributorId");
            contributors[i].Expectations = resultExpectations.recordset;

            if (contributors[i].Expectations){
                for (var j = 0; j < contributors[i].Expectations.length; j++){
                    const result1 = await pool.request()
                    .input('Id', contributors[i].Expectations[j].ContributionId)
                    .query("SELECT * FROM contributions WHERE Id = @Id");
                    contributors[i].Expectations[j].Contribution = result1.recordset[0];
                }
            }
        }

        res.render('contributor/index', {
            title: 'Contributor List',
            contributors,
            currentPage: page,
            totalPages: Math.ceil(totalContributors / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributorDetailGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        const contributorId = req.params.id;
        
        const resultContributor = await pool.request()
            .input('contributorId', contributorId)
            .query("SELECT * FROM Contributors WHERE ID = @contributorId");
        
        if (resultContributor.recordset.length === 0) {
            return res.status(404).send('Contributor not found');
        }

        const resultGroups = await pool.request()
            .input('communityid', resultContributor.recordset[0].CommunityId)
            .query("SELECT * FROM Groups WHERE CommunityId = @communityid");

        const resultGroupings = await pool.request()
            .input('contributorId', contributorId)
            .query("SELECT * FROM Groupings WHERE ContributorId = @contributorId");

        const resultExpectations = await pool.request()
            .input('contributorId', contributorId)
            .query("SELECT * FROM Expectations WHERE ContributorId = @contributorId");

        let contributor = resultContributor.recordset[0];
        let groups = resultGroups.recordset;
        let groupings = resultGroupings.recordset;
        let expectations = resultExpectations.recordset;

        for (var i = 0; i < groupings.length; i++){
            const result1 = await pool.request()
            .input('Id', groupings[i].GroupId)
            .query("SELECT * FROM groups WHERE Id = @Id");
            groupings[i].Group = result1.recordset[0];
        }

        for (var i = 0; i < expectations.length; i++){
            const result1 = await pool.request()
            .input('Id', expectations[i].ContributionId)
            .query("SELECT * FROM contributions WHERE Id = @Id");
            expectations[i].Contribution = result1.recordset[0];
        }

        const groupHtml = await AddGroup();

        res.render('contributor/detail', {
            title: 'Contributor Detail',
            contributor,
            groups,
            groupings,
            expectations,
            groupHtml
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributorDetailPost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
        
        const pool = await getPool();
        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, Community, IsActive } = req.body;

        await pool.request()
            .input('UserName', UserName)
            .input('Password', Password)
            .input('FirstName', FirstName)
            .input('LastName', LastName)
            .input('Email', Email)
            .input('Role', Role)
            .input('PhoneNumber', PhoneNumber)
            .input('Picture', Picture)
            .input('CommunityId', Community.Id)
            .input('IsActive', IsActive === 'true')
            .input('id', req.params.id)
            .query(`UPDATE Contributors SET UserName = @UserName, Password = @Password, FirstName = @FirstName, 
                    LastName = @LastName, Email = @Email, Role = @Role, PhoneNumber = @PhoneNumber, 
                    Picture = @Picture, CommunityId = @CommunityId, IsActive = @IsActive WHERE ID = @id`);
        
        res.redirect('/contributor');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributorUpdateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const contributorId = req.params.id;
        const pool = await getPool();

        const contributorResults = await pool.request()
            .input('id', contributorId)
            .query(`SELECT * FROM Contributors WHERE id = @id`);

        if (contributorResults.recordset.length === 0) {
            return res.status(404).send('Contributor not found');
        }

        const communitiesResults = await pool.request().query(`SELECT * FROM Communities`);
        
        let contributor = contributorResults.recordset[0];
        let communities = communitiesResults.recordset;

        res.render('contributor/update', {title: 'Update Contributor', contributor, communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributorUpdatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const contributorId = req.params.id;
        const pool = await getPool();

        await pool.request()
            .input('UserName', req.body.UserName)
            .input('Password', req.body.Password)
            .input('FirstName', req.body.FirstName)
            .input('LastName', req.body.LastName)
            .input('Email', req.body.Email)
            .input('Role', req.body.Role)
            .input('PhoneNumber', req.body.PhoneNumber)
            .input('Picture', req.file ? req.file.filename : req.body.Picture)
            .input('CommunityId', req.body.CommunityId)
            .input('IsActive', req.body.IsActive === 'true' ? 1 : 0)
            .input('id', contributorId)
            .query(`
            UPDATE Contributors 
            SET UserName = @UserName, Password = @Password, FirstName = @FirstName, LastName = @LastName, 
                Email = @Email, Role = @Role, PhoneNumber = @PhoneNumber, Picture = @Picture, CommunityId = @CommunityId, IsActive = @IsActive 
            WHERE id = @id
        `);

        res.redirect('/contributor');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err);
    }
};

const contributorUpdate1 = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const { groups, id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Contributor ID is required." });
        }

        const pool = await getPool();

        // Convert comma-separated string to an array
        const groupNames = Array.isArray(groups) ? groups : groups.split(',').map(name => name.trim()).filter(name => name !== "");
        if (groupNames.length === 0) {
            return res.status(400).json({ message: "No valid groups provided." });
        }

        // Find group IDs based on names
        const groupQuery = `SELECT id FROM Groups WHERE Name IN (${groupNames.map((_, i) => `@name${i}`).join(', ')})`;
        const groupRequest = pool.request();
        groupNames.forEach((name, i) => groupRequest.input(`name${i}`, name));
        const groupResults = await groupRequest.query(groupQuery);

        if (groupResults.recordset.length === 0) {
            return res.status(400).json({ message: "No valid groups found." });
        }

        const groupIds = groupResults.recordset.map(group => group.id);

        // Remove old groupings
        await pool.request()
            .input('id', id)
            .query(`DELETE FROM Groupings WHERE ContributorId = @id`);

        // Insert new groupings
        for (const groupId of groupIds) {
            await pool.request()
                .input('id', id)
                .input('groupId', groupId)
                .query(`INSERT INTO Groupings (ContributorId, GroupId) VALUES (@id, @groupId)`);
        }

        return res.send({ message: "Contributor updated successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
    }
};

const contributorCreateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        const communitiesResult = await pool.request().query("SELECT * FROM Communities");
        let communities = communitiesResult.recordset;
        res.render('contributor/create', { title: 'New Contributor', communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributorCreatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Community, IsActive } = req.body;
        let Picture = req.file ? req.file.filename : '';

        const pool = await getPool();
        await pool.request()
            .input('UserID', UserName)
            .input('UserName', UserName)
            .input('Password', Password)
            .input('FirstName', FirstName)
            .input('LastName', LastName)
            .input('Email', Email)
            .input('Role', Role)
            .input('PhoneNumber', PhoneNumber)
            .input('Picture', Picture)
            .input('CommunityId', Community)
            .input('IsActive', IsActive)
            .input('StartDate', new Date())
            .query("INSERT INTO Contributors (UserID, UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, CommunityId, IsActive, StartDate) VALUES (@UserID, @UserName, @Password, @FirstName, @LastName, @Email, @Role, @PhoneNumber, @Picture, @CommunityId, @IsActive, @StartDate)");
        
        res.redirect('/contributor');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributorDeleteGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        const contributorResult = await pool.request()
            .input('ID', req.params.id)
            .query("SELECT * FROM Contributors WHERE ID = @ID");

        if (contributorResult.recordset.length === 0) return res.status(404).send('Contributor not found');

        let contributor = contributorResult.recordset[0];
        
        res.render('contributor/delete', { title: 'Delete Contributor', contributor });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributorDeletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }
        
        const pool = await getPool();
        await pool.request()
            .input('ID', req.params.id)
            .query("DELETE FROM Contributors WHERE ID = @ID");
        
        res.redirect('/contributor');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const AddGroup = async () => {
    try {
        const pool = await getPool();
        const result = await pool.request().query("SELECT G.Name FROM Groupings AS GR JOIN Groups AS G ON GR.Group = G.ID");
        return result.recordset.map(item => item.Name).join("\n");
    } catch (err) {
        console.error(err);
        return "";
    }
};

module.exports = {
    contributorIndex,
    contributorDetailGet,
    contributorDetailPost,
    contributorUpdateGet,
    contributorUpdatePost,
    contributorUpdate1,
    contributorCreateGet,
    contributorCreatePost,
    contributorDeleteGet,
    contributorDeletePost,
    AddGroup
};
