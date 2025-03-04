const getPool = require('../middleware/sqlconnection');

const expectationIndex = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        
        const pool = await getPool();

        const totalExpectationsResult = await pool.request().query("SELECT COUNT(*) AS count FROM expectations");
        const expectationsResult = await pool.request().query("SELECT * FROM expectations ORDER BY Id DESC");
        
        const totalExpectations = totalExpectationsResult.recordset[0].count;
        let expectations = expectationsResult.recordset;
        
        for (var i = 0; i < expectations.length; i++){
            const result1 = await pool.request()
            .input('Id', expectations[i].ContributorId)
            .query("SELECT * FROM contributors WHERE Id = @Id");
            expectations[i].Contributor = result1.recordset[0];
        }

        for (var i = 0; i < expectations.length; i++){
            const result1 = await pool.request()
            .input('Id', expectations[i].ContributionId)
            .query("SELECT * FROM contributions WHERE Id = @Id");
            expectations[i].Contribution = result1.recordset[0];
        }

        res.render('expectation/index', {
            title: 'Expectation List',
            expectations,
            currentPage: page,
            totalPages: Math.ceil(totalExpectations / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationCreateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const pool = await getPool();

        const contributorsResult = await pool.request().query("SELECT * FROM contributors");
        const contributionsResult = await pool.request().query("SELECT * FROM contributions");
        
        const contributors = contributorsResult.recordset;
        const contributions = contributionsResult.recordset;
        
        res.render('expectation/create', { title: 'New Expectation', contributors, contributions });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationCreatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const { Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus } = req.body;
        const PaymentReciept = req.file ? req.file.filename : null;
        
        const pool = await getPool();

        await pool.request().query(`
            INSERT INTO expectations (Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus, PaymentReciept)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus, PaymentReciept]);
        
        res.redirect('/expectation');
    } catch (err) {
        console.error("Error saving expectation:", err);
        res.status(500).send("Error saving expectation.");
    }
};

const expectationUpdateGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const pool = await getPool();

        const expectationResult = await pool.request().query("SELECT * FROM expectations WHERE ID = " + req.params.id);
        const contributorsResult = await pool.request().query("SELECT * FROM contributors");
        const contributionsResult = await pool.request().query("SELECT * FROM contributions");

        const expectation = expectationResult.recordset[0];
        const contributors = contributorsResult.recordset;
        const contributions = contributionsResult.recordset;

        if (!expectation) return res.status(404).send('Expectation not found');
        
        res.render('expectation/update', { title: 'Update Expectation', expectation, contributors, contributions });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationUpdatePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const { Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus } = req.body;
        const PaymentReciept = req.file ? req.file.filename : req.body.PaymentReciept;
        
        const pool = await getPool();

        await pool.request().query(`
            UPDATE expectations SET Contributor=?, Contribution=?, AmountPaid=?, AmountToApprove=?, PaymentStatus=?, PaymentReciept=?
            WHERE ID=?
        `, [Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus, PaymentReciept, req.params.id]);
        
        res.redirect('/expectation');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationDeleteGet = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const pool = await getPool();

        const expectationResult = await pool.request()
        .input('Id', req.params.id)
        .query("SELECT * FROM expectations WHERE Id = @Id");
        const expectation = expectationResult.recordset[0];
        if (!expectation) return res.status(404).send('Expectation not found');
        
        res.render('expectation/delete', { title: 'Delete Expectation', expectation });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationDeletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        const pool = await getPool();

        await pool.request().query("DELETE FROM expectations WHERE ID = ?", [req.params.id]);
        res.redirect('/expectation');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting expectation' });
    }
};

const expectationPaymentGet = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const expectationId = req.params.id;

        const pool = await getPool();

        const expectationResult = await pool.request()
        .input('Id', expectationId)
        .query("SELECT * FROM expectations WHERE id = @Id");
        const expectation = expectationResult.recordset[0];

        const result1 = await pool.request()
        .input('Id', expectation.ContributorId)
        .query("SELECT * FROM contributors WHERE Id = @Id");
        expectation.Contributor = result1.recordset[0];

        const result2 = await pool.request()
        .input('Id', expectation.ContributionId)
        .query("SELECT * FROM contributions WHERE Id = @Id");
        expectation.Contribution = result2.recordset[0];

        if (!expectation) return res.status(404).send("Expectation not found");

        res.render('expectation/makePayment', { title: 'Update Expectation', expectation });

    } catch (err) {
        console.error("Error fetching expectation:", err);
        res.status(500).send("Server error");
    }
};

const expectationPaymentPost = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();

        const expectationId = req.params.id;
        const { AmountToApprove, PaymentMethod } = req.body;
        const PaymentReciept = req.file ? req.file.filename : "";

        await pool.request().query(`
            UPDATE expectations
            SET AmountToApprove = ${AmountToApprove}, PaymentStatus = 1, PaymentReciept = '${PaymentReciept}'
            WHERE id = ${expectationId}`); //PaymentMethod = ${PaymentMethod},

        res.redirect('/');

    } catch (err) {
        console.error("Error processing payment:", err);
        res.status(500).send("Server error.");
    }
};

const paymentApproval = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();

        const expectationResult = await pool.request().query(`SELECT * FROM expectations WHERE id = ${req.params.id}`);
        const expectation = expectationResult.recordset[0];

        if (expectation){
            const result1 = await pool.request()
            .input('Id', expectation.ContributionId)
            .query("SELECT * FROM contributions WHERE Id = @Id");
            expectation.Contribution = result1.recordset[0];
            res.render("expectation/paymentApproval", { title: "Approve Payment", expectation });
        } else{
            return res.status(404).send("Expectation not found");
        }

    } catch (error) {
        console.error("Error: ", error);
        res.status(500).send("Server error");
    }
};

const paymentApprove = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();

        const expectations = await pool.request().query(`SELECT * FROM expectations WHERE id = ${req.params.id}`);

        if (expectations.length === 0) return res.status(404).send("Expectation not found");

        const expectation = expectations.recordset[0];

        const result1 = await pool.request()
        .input('Id', expectation.ContributionId)
        .query("SELECT * FROM contributions WHERE Id = @Id");
        expectation.Contribution = result1.recordset[0];
        
        const updatedAmountPaid = expectation.AmountPaid + expectation.AmountToApprove;
        const paymentStatus = expectation.Contribution.Amount - updatedAmountPaid === 0 ? 3 : 2; // "Cleared" : "Approved"

        await pool.request().query(`
            UPDATE expectations
            SET AmountPaid = ${updatedAmountPaid}, AmountToApprove = 0, PaymentStatus = ${paymentStatus}
            WHERE id = ${expectation.Id}`);

        res.redirect("/expectation");

    } catch (error) {
        console.error("Error: ", error);
        res.status(500).send("Server error.");
    }
};

const paymentReject = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();

        await pool.request().query(`
            UPDATE expectations
            SET AmountToApprove = 0, PaymentStatus = 0
            WHERE id = ${req.params.id}`);

        res.redirect("/expectation");

    } catch (error) {
        console.error("Error: ", error);
        res.status(500).send("Server error.");
    }
};

const paymentWriteOff = async (req, res) => {
    try {
        const sessionData = req.session;
        if (!sessionData || !req.session.isLoggedIn) {
            return res.redirect('/login');
        }

        const pool = await getPool();

        const expectations = await pool.request().query(`SELECT * FROM expectations WHERE id = ${req.params.id}`);

        if (expectations.length === 0) return res.status(404).send("Expectation not found");

        const expectation = expectations.recordset[0];

        await pool.request().query(`
            UPDATE expectations
            SET AmountPaid = AmountToApprove, AmountToApprove = 0, PaymentStatus = 3
            WHERE id = ${expectation.Id}`);

        req.flash("message", "Success");
        res.redirect("/expectation");

    } catch (error) {
        console.error("Error: ", error);
        res.status(500).send("Server error.");
    }
};

module.exports = {
    expectationIndex,
    expectationCreateGet,
    expectationCreatePost,
    expectationUpdateGet,
    expectationUpdatePost,
    expectationDeleteGet,
    expectationDeletePost,
    expectationPaymentGet,
    expectationPaymentPost,
    paymentApproval,
    paymentApprove,
    paymentReject,
    paymentWriteOff
};
