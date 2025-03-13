const express = require("express");
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

router.get("/count/:communityid/:searchValue", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributors: [] });
        }

        const pool = await getPool();
        let query = req.params.communityid === 0 ? 'SELECT COUNT(*) AS total FROM Contributors' :
        `SELECT COUNT(*) AS total FROM Contributors WHERE CommunityId = ${req.params.communityid}`;

        if (req.params.searchValue != "*")
        {
            if (query.includes(" WHERE "))
                query = query + ` AND UserName LIKE '%${req.params.searchValue}%' OR FirstName LIKE '%${req.params.searchValue}%'
OR LastName LIKE '%${req.params.searchValue}%' OR Email LIKE '%${req.params.searchValue}%' OR PhoneNumber LIKE '%${req.params.searchValue}%'`;
            else
                query = query + ` WHERE UserName LIKE '%${req.params.searchValue}%' OR FirstName LIKE '%${req.params.searchValue}%'
OR LastName LIKE '%${req.params.searchValue}%' OR Email LIKE '%${req.params.searchValue}%' OR PhoneNumber LIKE '%${req.params.searchValue}%'`;
        }
        
        const totalContributorsResult = await pool.request().query(query);
        const totalContributors = totalContributorsResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalContributors });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, totalContributors: 0 });
    }
});

// Get all contributors
router.get("/all", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributors: [] });
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
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributors: [] });
        }

        const skip = req.query.skip;
        const limit = req.query.limit;
        const communityid = req.query.communityid;
        const searchValue = req.query.searchValue;

        const pool = await getPool();

        let query = "SELECT * FROM Contributors";
        
        if (communityid == 0){
            query = query + ` WHERE communityid = ${communityid}`;
        }

        if (searchValue && searchValue === "*") {
        }else{
            if (query.includes(" WHERE "))
                query = query + ` AND UserName LIKE '%${searchValue}%' OR FirstName LIKE '%${searchValue}%'
OR LastName LIKE '%${searchValue}%' OR Email LIKE '%${searchValue}%' OR PhoneNumber LIKE '%${searchValue}%'`;
            else
                query = query + ` WHERE UserName LIKE '%${searchValue}%' OR FirstName LIKE '%${searchValue}%'
OR LastName LIKE '%${searchValue}%' OR Email LIKE '%${searchValue}%' OR PhoneNumber LIKE '%${searchValue}%'`;
        }

        query = query + " ORDER BY Id DESC";

        if (skip && limit && skip != 0 && limit != 0){
            query = query + ` OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;
        }

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
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributor: null });
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
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributor: null });
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
        
        res.json({ issuccess: true, message: "", contributor: { Id, UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, Community, IsActive } });
    } catch (err) {
        res.status(500).json({ issuccess: false, message: err.message, contributor: null });
    }
});

// Update an existing contributor
router.post("/update/:id", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributor: null });
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
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributor: null });
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
        const result = await pool.request().query("SELECT G.Name FROM Groupings AS GR JOIN Groups AS G ON GR.GroupId = G.ID");
        return result.recordset.map(item => item.Name).join("\n");
    } catch (err) {
        console.error(err);
        return "";
    }
};

router.post("/update1", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", contributor: null });
        }

        const pool = await getPool();
        
        const { groups, id } = req.body; // Use req.body for POST
        
        if (!id) {
            return res.status(400).json({ issuccess: false, message: "Contributor ID is required.", contributor: null });
        }

        // Convert comma-separated string to an array and remove empty values
        const groupNames = Array.isArray(groups) ? groups : groups.split(',').filter(name => name.trim() !== "");

        let groupDocs = [];

        if (groupNames != ""){
            // Find group IDs based on names
            let str = "";
            for (let i = 0; i < groupNames.length; i++){
                str = str + "'" + groupNames[i] + "'";
                if (groupNames.length > i + 1)
                    str = str + ", ";
            }
            const groupsResult = await pool.request().query(`SELECT * FROM Groups WHERE Name IN (${str})`);
            groupDocs = groupsResult.recordset;

            if (groupDocs.length === 0) {
                return res.status(400).json({ issuccess: false, message: "No valid groups found.", contributor: null });
            }
        }

        const groupIds = groupDocs.map(group => group.Id);

        const resultContributor = await pool.request()
            .input("id", id)
            .query("SELECT * FROM Contributors WHERE id = @id");
        
        let contributor = resultContributor.recordset[0];
        if (!contributor) {
            return res.status(404).json({ issuccess: false, message: "Contributor not found.", contributor });
        }

        // Update contributor's groups in the Grouping model
        await pool.request()
            .input('id', id)
            .query('DELETE FROM Groupings WHERE ContributorId = @id'); // Remove old groupings
        
        for (const groupId of groupIds) {
            await pool.request()
                .input('ContributorId', id)
                .input('GroupId', groupId)
                .query('INSERT INTO Groupings (ContributorId, GroupId) OUTPUT INSERTED.ID VALUES (@ContributorId, @GroupId)');
        }
        
        return res.json({ issuccess: true, message: "Contributor updated successfully!", contributor });

    } catch (error) {
        return res.status(400).json({ issuccess: false, message: error, contributor: null });
    }
});

module.exports = router;