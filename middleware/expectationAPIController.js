const express = require('express');
const getPool = require('../middleware/sqlconnection');
const sql = require('mssql');

const router = express.Router();

router.get('/all', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();
        const expectationsResult = await pool.request().query('SELECT * FROM expectations');
        let expectations = expectationsResult.recordset;

        return res.json({ issuccess: true, message: "", expectations });
    } catch (err) {
        return res.json({ issuccess: false, message: "Server Error: " + err, expectations: [] });
    }
});

router.get('/count', async (req, res) => {
    try {
        const pool = await getPool();
        const totalExpectationsResult = await pool.request().query('SELECT COUNT(*) AS total FROM expectations');
        const totalExpectations = totalExpectationsResult.recordset[0].total;

        return res.json({ issuccess: true, message: "", totalExpectations });
    } catch (err) {
        return res.json({ issuccess: false, message: "Server Error: " + err, totalExpectations: 0 });
    }
});

router.get('', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const skip = req.query.skip;
        const limit = req.query.limit;
        
        const pool = await getPool();

        const query = !skip || !limit || skip == 0 || limit == 0 
            ? `SELECT * FROM expectations ORDER BY Id DESC` 
            : `SELECT * FROM expectations ORDER BY Id DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;

        const expectationsResult = await pool.request().query(query);
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

        return res.json({ issuccess: true, message: "", expectations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ issuccess: true, message: err, expectations: [] });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();
        const expectationResult = await pool.request().query("SELECT * FROM expectations WHERE ID = " + req.params.id);
        const expectation = expectationResult.recordset[0];

        if (expectation){
            const result1 = await pool.request()
            .input('Id', expectation.ContributorId)
            .query("SELECT * FROM contributors WHERE Id = @Id");
            expectation.Contributor = result1.recordset[0];

            const result2 = await pool.request()
            .input('Id', expectation.ContributionId)
            .query("SELECT * FROM contributions WHERE Id = @Id");
            expectation.Contribution = result2.recordset[0];

            return res.json({ issuccess: true, message: "", expectation });
        } else {
            return res.json({ issuccess: false, message: "Expectation not found", expectation: null });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ issuccess: false, message: err, expectation: null });
    }
});

router.get('/getbycontributor/:id', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();
        const expectationResult = await pool.request()
                            .input('ContributorId', req.params.id)
                            .query("SELECT * FROM expectations WHERE ContributorId = @ContributorId");
        const expectations = expectationResult.recordset;

        const result1 = await pool.request()
        .input('Id', req.params.id)
        .query("SELECT * FROM contributors WHERE Id = @Id");

        for (var i = 0; i < expectations.length; i++){
            expectations[i].Contributor = result1.recordset[0];

            const result2 = await pool.request()
            .input('Id', expectations[i].ContributionId)
            .query("SELECT * FROM contributions WHERE Id = @Id");
            expectations[i].Contribution = result2.recordset[0];
        }

        return res.json({ issuccess: true, message: "", expectations });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ issuccess: false, message: err, expectation: null });
    }
});

router.post('/', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const { Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus } = req.body;
        const PaymentReciept = req.file ? req.file.filename : null;
        
        const pool = await getPool();

        const newExpectationResult = await pool.request().query(`
            INSERT INTO expectations (Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus, PaymentReciept) OUTPUT INSERTED.ID
            VALUES (${Contributor}, ${Contribution}, ${AmountPaid}, ${AmountToApprove}, ${PaymentStatus}, ${PaymentReciept})
        `);
        
        const Id = newExpectationResult.recordset[0].ID;
        return res.json({ issuccess: true, message: "", expectation: { Id, Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus } });
    } catch (err) {
        console.error("Error saving expectation:", err);
        return res.status(500).json({ issuccess: false, message: err, expectation: null });
    }
});

router.post('/update/:id', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const { Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus } = req.body;
        const PaymentReciept = req.file ? req.file.filename : req.body.PaymentReciept;
        
        const pool = await getPool();

        await pool.request().query(`
            UPDATE expectations SET Contributor=${Contributor}, Contribution=${Contribution}, AmountPaid=${AmountPaid}, AmountToApprove=${AmountToApprove}, PaymentStatus=${PaymentStatus}, PaymentReciept=${PaymentReciept}
            WHERE ID=${req.params.id}
        `);
        
        return res.json({ issuccess: true, message: "", expectation: { Id: req.params.id, Contributor, Contribution, AmountPaid, AmountToApprove, PaymentStatus } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ issuccess: false, message: err, expectation: null });
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();

        await pool.request().query("DELETE FROM expectations WHERE ID = ${req.params.id}");
        
        return res.json({ issuccess: true, message: "", expectation: null });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ issuccess: false, message: err, expectation: null });
    }
});

router.post('/payment/:id', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();

        const expectationId = req.params.id;
        const { AmountToApprove, PaymentMethod } = req.body;
        const PaymentReciept = req.file ? req.file.filename : "";

        await pool.request().query(`
            UPDATE expectations
            SET AmountToApprove = ${AmountToApprove}, PaymentStatus = 1, PaymentReciept = '${PaymentReciept}'
            WHERE id = ${expectationId}`); //PaymentMethod = ${PaymentMethod},

        return res.json({ issuccess: true, message: "", expectation: null });
    } catch (err) {
        console.error("Error processing payment:", err);
        res.status(500).json({ issuccess: false, message: err, expectation: null });
    }
});

router.get('/paymentapprove/:id', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();

        const expectations = await pool.request().query(`SELECT * FROM expectations WHERE id = ${req.params.id}`);

        if (expectations.length === 0)
            return res.status(404).json({ issuccess: false, message: "Expectation not found", expectation: null });

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

        return res.json({ issuccess: true, message: "", expectation: null });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ issuccess: false, message: err, expectation: null });
    }
});

router.get('/paymentreject/:id', async (req, res) => {
    try {
        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();

        await pool.request().query(`
            UPDATE expectations
            SET AmountToApprove = 0, PaymentStatus = 0
            WHERE id = ${req.params.id}`);

        return res.json({ issuccess: true, message: "", expectation: null });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ issuccess: false, message: err, expectation: null });
    }
});

router.get('/paymentwriteoff/:id', async (req, res) => {
    try {
console.log("HERE!!!");

        const sessionData = req.cookies['connect.sid'];
    
        if (!sessionData) {
            return res.json({ issuccess: false, message: "User not authorized", totalContributions: 0 });
        }

        const pool = await getPool();

        const expectations = await pool.request().query(`SELECT * FROM expectations WHERE id = ${req.params.id}`);

        if (expectations.length === 0)
            return res.status(404).json({ issuccess: false, message: "Expectation not found", expectation: null });

        const expectation = expectations.recordset[0];

        await pool.request().query(`
            UPDATE expectations
            SET AmountPaid = AmountToApprove, AmountToApprove = 0, PaymentStatus = 3
            WHERE id = ${expectation.Id}`);

        return res.json({ issuccess: true, message: "", expectation: null });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ issuccess: false, message: err, expectation: null });
    }
});

module.exports = router;
