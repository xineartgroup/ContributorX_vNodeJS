const express = require("express");
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

router.get("/count", async (req, res) => {
    try {
        const pool = await getPool();
        const totalGroupingsResult = await pool.request().query('SELECT COUNT(*) AS total FROM Grouping');
        const totalGroupings = totalGroupingsResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalGroupings });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, totalGroupings: 0 });
    }
});

// Get all groupings
router.get("/all", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query("SELECT * FROM Grouping");
        const groupings = result.recordset;
        res.json({ issuccess: true, message: "", groupings });
    } catch (err) {
        res.status(500).json({ issuccess: false, message: err.message, return: [] });
    }
});

// Get list of groupings
router.get("/", async (req, res) => {
    try {
        const skip = req.query.skip;
        const limit = req.query.limit;

        const pool = await getPool();

        const groupingsResult = await pool.request().query(
            `SELECT * FROM Grouping ORDER BY Id OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`
        );
        const groupings = groupingsResult.recordset;
            
        for (var i = 0; i < groupings.length; i++){
            const result1 = await pool.request()
            .input('Id', groupings[i].GroupId)
            .query("SELECT * FROM groups WHERE Id = @Id");
            groupings[i].Group = result1.recordset[0];

            const result2 = await pool.request()
            .input('Id', groupings[i].ContributorId)
            .query("SELECT * FROM contributors WHERE Id = @Id");
            groupings[i].Contributor = result2.recordset[0];
        }

        res.json({ issuccess: true, message: "", groupings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ issuccess: false, message: err.message, groupings: [] });
    }
});

// Get a single grouping by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        const resultGrouping = await pool.request()
            .input("id", id)
            .query("SELECT * FROM Grouping WHERE id = @id");
        
        if (resultGrouping.recordset.length > 0) {
            const grouping = resultGrouping.recordset;
            
            const result1 = await pool.request()
            .input('Id', grouping.GroupId)
            .query("SELECT * FROM groups WHERE Id = @Id");
            grouping.Group = result1.recordset[0];

            const result2 = await pool.request()
            .input('Id', grouping.ContributorId)
            .query("SELECT * FROM contributors WHERE Id = @Id");
            grouping.Contributor = result2.recordset[0];
            
            return res.json({ issuccess: true, message: "", grouping });
        }
        
        res.status(500).json({ issuccess: false, message: "No grouping found", grouping });
    } catch (err) {
        console.error(err);
        res.status(500).json({ issuccess: false, message: err.message, result: grouping });
    }
});

// Create a new grouping
router.post("/", async (req, res) => {
    try {
        const { Contributor, Group } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('ContributorId', Contributor)
            .input('GroupId', Group)
            .query('INSERT INTO Grouping (ContributorId, GroupId) OUTPUT INSERTED.ID VALUES (@ContributorId, @GroupId)');

        const Id = result.recordset[0].ID;
        
        res.json({ issuccess: true, message: "", grouping: { Id, Contributor, Group } });
    } catch (err) {
        console.error('Error saving grouping:', err);
        res.status(500).json({ issuccess: false, message: err.message, grouping: null });
    }
});

// Update an existing grouping
router.post("/update/:id", async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .input('ContributorId', req.body.Contributor)
            .input('GroupId', req.body.Group)
            .query('UPDATE Grouping SET ContributorId = @ContributorId, GroupId = @GroupId WHERE Id = @id');
            
            res.json({ issuccess: true, message: "", grouping: { Id, Contributor, Group } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ issuccess: false, message: err.message, grouping: null });
    }
});

// Delete a grouping
router.post("/delete/:id", async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .query('DELETE FROM Grouping WHERE Id = @id');
        res.json({ issuccess: true, message: "", grouping: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ issuccess: false, message: err.message, grouping: null });
    }
});

module.exports = router;
