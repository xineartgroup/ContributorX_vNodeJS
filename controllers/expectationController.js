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
        
        const contributors = await sql.query("SELECT * FROM contributors");
        const contributions = await sql.query("SELECT * FROM contributions");
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
        
        await sql.query(`
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
        
        const expectation = await sql.query("SELECT * FROM expectations WHERE ID = ?", [req.params.id]);
        const contributors = await sql.query("SELECT * FROM contributors");
        const contributions = await sql.query("SELECT * FROM contributions");
        if (!expectation.length) return res.status(404).send('Expectation not found');
        
        res.render('expectation/update', { title: 'Update Expectation', expectation: expectation[0], contributors, contributions });
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
        
        await sql.query(`
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
        
        const expectation = await sql.query("SELECT * FROM expectations WHERE ID = ?", [req.params.id]);
        if (!expectation.length) return res.status(404).send('Expectation not found');
        
        res.render('expectation/delete', { title: 'Delete Expectation', expectation: expectation[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const expectationDeletePost = async (req, res) => {
    try {
        if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');
        
        await sql.query("DELETE FROM expectations WHERE ID = ?", [req.params.id]);
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

        const query = `
            SELECT e.*, c.Name AS ContributorName, cb.Title AS ContributionTitle
            FROM Expectation e
            JOIN Contributor c ON e.Contributor = c.id
            JOIN Contribution cb ON e.Contribution = cb.id
            WHERE e.id = ?`;

        const expectations = await sqlconnection.query(query, [expectationId]);

        if (expectations.length === 0) return res.status(404).send("Expectation not found");

        res.render('expectation/makePayment', { title: 'Update Expectation', expectation: expectations[0] });

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

        const expectationId = req.params.id;
        const { AmountToApprove, PaymentMethod } = req.body;
        const PaymentReciept = req.file ? req.file.filename : "";

        const query = `
            UPDATE Expectation
            SET AmountToApprove = ?, PaymentMethod = ?, PaymentStatus = 1, PaymentReciept = ?
            WHERE id = ?`;

        await sqlconnection.query(query, [AmountToApprove, PaymentMethod, PaymentReciept, expectationId]);

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

        const expectationId = req.params.id;

        const query = `
            SELECT e.*, c.Name AS ContributorName, cb.Title AS ContributionTitle
            FROM Expectation e
            JOIN Contributor c ON e.Contributor = c.id
            JOIN Contribution cb ON e.Contribution = cb.id
            WHERE e.id = ?`;

        const expectations = await sqlconnection.query(query, [expectationId]);

        if (expectations.length === 0) return res.status(404).send("Expectation not found");

        res.render("expectation/paymentApproval", { title: "Approve Payment", expectation: expectations[0] });

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

        const expectationId = req.params.id;

        const expectationQuery = `SELECT * FROM Expectation WHERE id = ?`;
        const expectations = await sqlconnection.query(expectationQuery, [expectationId]);

        if (expectations.length === 0) return res.status(404).send("Expectation not found");

        const expectation = expectations[0];

        const updatedAmountPaid = expectation.AmountPaid + expectation.AmountToApprove;
        const paymentStatus = expectation.Contribution.Amount - updatedAmountPaid === 0 ? 3 : 2; // "Cleared" : "Approved"

        const updateQuery = `
            UPDATE Expectation
            SET AmountPaid = ?, AmountToApprove = 0, PaymentStatus = ?
            WHERE id = ?`;

        await sqlconnection.query(updateQuery, [updatedAmountPaid, paymentStatus, expectationId]);

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

        const expectationId = req.params.id;

        const query = `
            UPDATE Expectation
            SET AmountToApprove = 0, PaymentStatus = 0
            WHERE id = ?`;

        await sqlconnection.query(query, [expectationId]);

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

        const expectationId = req.params.id;

        const expectationQuery = `SELECT * FROM Expectation WHERE id = ?`;
        const expectations = await sqlconnection.query(expectationQuery, [expectationId]);

        if (expectations.length === 0) return res.status(404).send("Expectation not found");

        const expectation = expectations[0];

        const updateQuery = `
            UPDATE Expectation
            SET AmountPaid = AmountToApprove, AmountToApprove = 0, PaymentStatus = 3
            WHERE id = ?`;

        await sqlconnection.query(updateQuery, [expectationId]);

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
