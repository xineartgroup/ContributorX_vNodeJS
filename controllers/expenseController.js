const getPool = require('../middleware/sqlconnection');

const expenseIndex = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const pool = await getPool();
        const totalExpensesResult = await pool.request().query('SELECT COUNT(*) AS total FROM Expenses');
        const totalExpenses = totalExpensesResult.recordset[0].total;

        const expensesResult = await pool.request()
            .query(`SELECT e.*, c.Name AS CommunityName FROM Expenses e 
                    LEFT JOIN Communities c ON e.CommunityId = c.Id 
                    ORDER BY e.DateCreated DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`);
        const expenses = expensesResult.recordset;

        for (var i = 0; i < expenses.length; i++){
            const result1 = await pool.request()
            .input('Id', expenses[i].CommunityId)
            .query("SELECT * FROM communities WHERE Id = @Id");
            expenses[i].Community = result1.recordset[0];
        }

        res.render('expense/index', {
            title: 'Expense List',
            expenses,
            currentPage: page,
            totalPages: Math.ceil(totalExpenses / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expenseCreateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        const communitiesResult = await pool.request().query('SELECT Id, Name FROM Communities');
        const communities = communitiesResult.recordset;

        res.render('expense/create', { title: 'New Expense', communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err);
    }
};

const expenseCreatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const { Name, Description, AmountPaid, Community } = req.body;
        if (!req.file) {
            return res.status(400).send("Payment Receipt file is required.");
        }

        const pool = await getPool();
        await pool.request()
            .input('Name', Name)
            .input('Description', Description)
            .input('DateCreated', new Date())
            .input('AmountPaid', AmountPaid)
            .input('CommunityId', Community)
            .input('PaymentReciept', req.file.filename)
            .query('INSERT INTO Expenses (Name, Description, DateCreated, AmountPaid, CommunityId, PaymentReciept) VALUES (@Name, @Description, @DateCreated, @AmountPaid, @CommunityId, @PaymentReciept)');

        res.redirect('/expense');
    } catch (err) {
        console.error("Error saving expense:", err);
        res.status(500).send("Error saving expense.");
    }
};

const expenseUpdateGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        const expenseResult = await pool.request()
            .input('id', req.params.id)
            .query('SELECT * FROM Expenses WHERE Id = @id');
        const expense = expenseResult.recordset[0];

        const communitiesResult = await pool.request().query('SELECT Id, Name FROM Communities');
        const communities = communitiesResult.recordset;

        if (!expense) return res.status(404).send('Expense not found');

        const result1 = await pool.request()
        .input('Id', expense.CommunityId)
        .query("SELECT * FROM communities WHERE Id = @Id");
        expense.Community = result1.recordset[0];

        res.render('expense/update', { title: 'Update Expense', expense, communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expenseUpdatePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .input('Name', req.body.Name)
            .input('Description', req.body.Description)
            .input('AmountPaid', req.body.AmountPaid)
            .input('CommunityId', req.body.Community)
            .input('PaymentReciept', req.file ? req.file.filename : req.body.PaymentReciept ? req.body.PaymentReciept : '')
            .query('UPDATE Expenses SET Name = @Name, Description = @Description, AmountPaid = @AmountPaid, CommunityId = @CommunityId, PaymentReciept = @PaymentReciept WHERE Id = @id');
        
        res.redirect('/expense');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expenseDeleteGet = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        const expenseResult = await pool.request()
            .input('id', req.params.id)
            .query('SELECT e.*, c.Name AS CommunityName FROM Expenses e LEFT JOIN Communities c ON e.CommunityId = c.Id WHERE e.Id = @id');
        const expense = expenseResult.recordset[0];

        if (!expense) return res.status(404).send('Expense not found');

        res.render('expense/delete', { title: 'Delete Expense', expense });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expenseDeletePost = async (req, res) => {
    try {
        if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .query('DELETE FROM Expenses WHERE Id = @id');
        
        res.redirect('/expense');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting expense' });
    }
};

module.exports = {
    expenseIndex,
    expenseCreateGet,
    expenseCreatePost,
    expenseUpdateGet,
    expenseUpdatePost,
    expenseDeleteGet,
    expenseDeletePost
};
