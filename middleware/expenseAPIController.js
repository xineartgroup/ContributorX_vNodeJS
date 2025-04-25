const express = require("express");
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

router.get("/count/:communityid/:searchValue", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", totalExpenses: [] });
        }

        const pool = await getPool();
        let query = req.params.communityid === 0 ? 'SELECT COUNT(*) AS total FROM Expenses' :
        `SELECT COUNT(*) AS total FROM Expenses WHERE CommunityId = ${req.params.communityid}`;

        if (req.params.searchValue != "*")
        {
            if (query.includes(" WHERE "))
                query = query + ` AND Name LIKE '%${req.params.searchValue}%' OR Description LIKE '%${req.params.searchValue}%'`;
            else
                query = query + ` WHERE Name LIKE '%${req.params.searchValue}%' OR Description LIKE '%${req.params.searchValue}%'`;
        }

        const totalExpensesResult = await pool.request().query(query);
        const totalExpenses = totalExpensesResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalExpenses });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, totalExpenses: 0 });
    }
});

// Get all expenses
router.get("/all", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", expenses: [] });
        }

        const pool = await getPool();
        const result = await pool.request().query("SELECT * FROM Expenses");
        const expenses = result.recordset;
        
        for (var i = 0; i < expenses.length; i++){
            const result1 = await pool.request()
            .input('Id', expenses[i].CommunityId)
            .query("SELECT * FROM Communities WHERE Id = @Id");
            expenses[i].Community = result1.recordset[0];
        }

        res.json({ issuccess: true, message: "", expenses });
    } catch (error) {
        res.json({ issuccess: false, message: "Server error: " + error, expenses: [] });
    }
});

// Get list of expenses
router.get("/", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", expenses: [] });
        }

        const skip = req.query.skip;
        const limit = req.query.limit;
        const communityid = req.query.communityid;
        const searchValue = req.query.searchValue;
        const sortName = req.query.sortName;
        const sortOrder = req.query.sortOrder;
    
        const pool = await getPool();

        let query = "SELECT * FROM Expenses";
        
        if (communityid > 0){
            query = query + ` WHERE communityid = ${communityid}`;
        }

        if (searchValue && searchValue === "*") {
        }else{
            if (query.includes(" WHERE "))
                query = query + ` AND Name LIKE '%${searchValue}%' OR Description LIKE '%${searchValue}%'`;
            else
                query = query + ` WHERE Name LIKE '%${searchValue}%' OR Description LIKE '%${searchValue}%'`;
        }

        query = query + ` ORDER BY ${sortName} ${sortOrder}`;

        if (skip && limit){
            query = query + ` OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;
        }

        const result = await pool.request().query(query);
        const expenses = result.recordset;
        
        for (var i = 0; i < expenses.length; i++){
            const result1 = await pool.request()
            .input('Id', expenses[i].CommunityId)
            .query("SELECT * FROM Communities WHERE Id = @Id");
            expenses[i].Community = result1.recordset[0];
        }

        res.json({ issuccess: true, message: "", expenses });
    } catch (error) {
        res.json({ issuccess: false, message: "Server error: " + error, expenses: [] });
    }
});

// Get a single expense by ID
router.get("/:id", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", expense: null });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input("id", req.params.id)
            .query("SELECT * FROM Expenses WHERE id = @id");
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Expenses not found" });
        }
        const expense = result.recordset.length > 0 ? result.recordset[0] : null;
        
        if (!expense) {
            const result1 = await pool.request()
            .input('Id', expense.CommunityId)
            .query("SELECT * FROM Communities WHERE Id = @Id");
            expense.Community = result1.recordset.length > 0 ? result1.recordset[0] : null;
            
            res.json({ issuccess: true, message: "", expense });
        }
    } catch (error) {
        res.json({ issuccess: false, message: "Server error: " + error, expense: null });
    }
});

// Create a new expense
router.post("/", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", expense: null });
        }

        const { Name, Description, DateCreated, AmountPaid, Community, PaymentReciept } = req.body;
        
        const pool = await getPool();
        const result = await pool.request()
            .input("Name", Name)
            .input("Description", Description)
            .input("DateCreated", DateCreated)
            .input("AmountPaid", AmountPaid)
            .input("CommunityId", Community)
            .input("PaymentReciept", PaymentReciept)
            .query("INSERT INTO Expenses (Name, Description, DateCreated, AmountPaid, CommunityId, PaymentReciept) OUTPUT INSERTED.ID VALUES (@Name, @Description, @DateCreated, @AmountPaid, @CommunityId, @PaymentReciept);");
        
        const Id = result.recordset.length > 0 ? result.recordset[0].ID : 0;
        
        res.json({ issuccess: true, message: "", expense: { Id, Name, Description, DateCreated, AmountPaid, Community, PaymentReciept } });
    } catch (error) {
        res.json({ issuccess: false, message: "Server error: " + error, expense: null });
    }
});

// Update a expense
router.post("/update/:id", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", expense: null });
        }

        const { Name, Description, DateCreated, AmountPaid, Community, PaymentReciept } = req.body;
        const pool = await getPool();
        await pool.request()
            .input("id", req.params.id)
            .input("Name", Name)
            .input("Description", Description)
            .input("AmountPaid", AmountPaid)
            .input("CommunityId", Community)
            .input("PaymentReciept", PaymentReciept ? PaymentReciept : '')
            .query("UPDATE Expenses SET Name = @Name, Description = @Description, AmountPaid = @AmountPaid, CommunityId = @CommunityId, PaymentReciept = @PaymentReciept WHERE id = @id");
        res.json({ issuccess: true, message: "", expense: { Id: req.params.id, Name, Description, DateCreated, AmountPaid, Community, PaymentReciept } });
    } catch (error) {
        res.json({ issuccess: false, message: "Server error: " + error, expense: null });
    }
});

// Delete a expense
router.post("/delete/:id", async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.json({ issuccess: false, message: "User not authorized", expense: null });
        }

        const pool = await getPool();
        await pool.request()
            .input("id", req.params.id)
            .query("DELETE FROM Expenses WHERE id = @id");
        res.json({ issuccess: true, message: "", expense: null });
    } catch (error) {
        res.json({ issuccess: false, message: "Server error: " + error, expense: null });
    }
});

module.exports = router;