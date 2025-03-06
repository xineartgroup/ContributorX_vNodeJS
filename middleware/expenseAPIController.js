const express = require("express");
const getPool = require('../middleware/sqlconnection');

const router = express.Router();

router.get("/count", async (req, res) => {
    try {
        const pool = await getPool();
        const totalExpensesResult = await pool.request().query('SELECT COUNT(*) AS total FROM Expenses');
        const totalExpenses = totalExpensesResult.recordset[0].total;

        res.json({ issuccess: true, message: "", totalExpenses });
    } catch (err) {
        res.json({ issuccess: false, message: "Server Error: " + err, totalExpenses: 0 });
    }
});

// Get all expenses
router.get("/all", async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
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
        const skip = req.query.skip;
        const limit = req.query.limit;
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const query = !skip || !limit || skip == 0 || limit == 0 
            ? `SELECT * FROM Expenses ORDER BY Id DESC` 
            : `SELECT * FROM Expenses ORDER BY Id DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;

        const pool = await getPool();
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
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", expense: null });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input("id", req.params.id)
            .query("SELECT * FROM Expenses WHERE id = @id");
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Expenses not found" });
        }
        const expense = result.recordset[0];
        
        const result1 = await pool.request()
        .input('Id', expense.CommunityId)
        .query("SELECT * FROM Communities WHERE Id = @Id");
        expense.Community = result1.recordset[0];
        
        res.json({ issuccess: true, message: "", expense });
    } catch (error) {
        res.json({ issuccess: false, message: "Server error: " + error, expense: null });
    }
});

// Create a new expense
router.post("/", async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
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
        
        const Id = result.recordset[0].ID;
        
        res.json({ issuccess: true, message: "", expense: { Id, Name, Description, DateCreated, AmountPaid, Community, PaymentReciept } });
    } catch (error) {
        res.json({ issuccess: false, message: "Server error: " + error, expense: null });
    }
});

// Update a expense
router.post("/update/:id", async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
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
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
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