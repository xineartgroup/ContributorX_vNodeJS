const express = require("express");
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

router.get("/count", async (req, res) => {
    try {
        const pool = await getPool();
        const totalContributorsResult = await pool.request().query('SELECT COUNT(*) AS total FROM Contributors');
        const totalContributors = totalContributorsResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalContributors });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, totalContributors: 0 });
    }
});

// Get all contributors
router.get("/all", async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();
        const result = await pool.request().query("SELECT * FROM Contributors");
        const contributors = result.recordset;
        res.json({ issuccess: true, message: "", contributors });
    } catch (err) {
        res.status(500).json({ issuccess: false, message: err.message, contributors: [] });
    }
});

// Get list of contributors
router.get("/", async (req, res) => {
    try {
        const skip = req.query.skip;
        const limit = req.query.limit;
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const query = !skip || !limit || skip == 0 || limit == 0 
            ? `SELECT * FROM Contributors ORDER BY Id DESC` 
            : `SELECT * FROM Contributors ORDER BY Id DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;

        const pool = await getPool();
        const result = await pool.request().query(query);
        const contributors = result.recordset;

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

        res.json({ issuccess: true, message: "", contributors });
    } catch (err) {
        res.status(500).json({ issuccess: false, message: err.message, contributors: [] });
    }
});

// Get a single contributor by ID
router.get("/:id", async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const { id } = req.params;
        const pool = await getPool();
        const resultContributor = await pool.request()
            .input("id", id)
            .query("SELECT * FROM Contributors WHERE id = @id");

        if (resultContributor.recordset.length > 0) {
    
            const resultGroups = await pool.request()
                .input('communityid', resultContributor.recordset[0].CommunityId)
                .query("SELECT * FROM Groups WHERE CommunityId = @communityid");
    
            const resultGroupings = await pool.request()
                .input('contributorId', id)
                .query("SELECT * FROM Groupings WHERE ContributorId = @contributorId");
    
            const resultExpectations = await pool.request()
                .input('contributorId', id)
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
    
            res.json({ issuccess: true, message: "", contributor, groups, groupings, expectations });
        }
    } catch (err) {
        res.status(500).json({ issuccess: false, message: err.message, contributor: null, groups: [], groupings: [], expectations: [] });
    }
});

// Create a new contributor
router.post("/", async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Community, IsActive } = req.body;
        let Picture = req.file ? req.file.filename : '';

        const pool = await getPool();
        const result = await pool.request()
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
        .query("INSERT INTO Contributors (UserID, UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, CommunityId, IsActive, StartDate) OUTPUT INSERTED.ID VALUES (@UserID, @UserName, @Password, @FirstName, @LastName, @Email, @Role, @PhoneNumber, @Picture, @CommunityId, @IsActive, @StartDate)");
        
        const Id = result.recordset[0].ID;
        
        res.json({ issuccess: true, message: "", contributor: { Id, UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Community, IsActive } });
    } catch (err) {
        res.status(500).json({ issuccess: false, message: err.message, contributor: null });
    }
});

// Update an existing contributor
router.post("/update/:id", async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const { id } = req.params;
        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, Community, IsActive } = req.body;
        const pool = await getPool();

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

        res.json({ issuccess: true, message: "", contributor: { id, UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, Community, IsActive } });
    } catch (err) {
        res.status(500).json({ issuccess: false, message: err.message, contributor: null });
    }
});

// Delete a contributor
router.post("/delete/:id", async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const { id } = req.params;
        const pool = await getPool();
        await pool.request().input("id", id).query("DELETE FROM Contributors WHERE id = @id");
        res.json({ issuccess: true, message: "", contributor: null });
    } catch (err) {
        res.status(500).json({ issuccess: false, message: err.message, contributor: null });
    }
});

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

module.exports = router;