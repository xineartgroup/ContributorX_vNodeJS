const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require("connect-flash");

/*const mongoose = require('mongoose');*/
const authController = require('./controllers/authController');
const communityRoutes = require('./routes/communityRoutes');
const groupRoutes = require('./routes/groupRoutes');
const groupingRoutes = require('./routes/groupingRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const expectationRoutes = require('./routes/expectationRoutes');
const contributorRoutes = require('./routes/contributorRoutes');

const authapiController = require('./middleware/authAPIController');
const communityapiController = require('./middleware/communityAPIController');

const sql = require('mssql');
const getPool = require('./middleware/sqlconnection');

const app = express();

app.listen(3000);

/*const Expectation = require('./models/expectation');

const dbURI = 'mongodb://localhost:27017/cbtr-mgr';

mongoose.set('strictQuery', false);

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));

const getGroups = require('./controllers/testconnection');

app.get('/', async (req, res) => {
    try {
        const groups = await getGroups();
        res.json(groups);
    } catch (error) {
        console.error("Error fetching groups:", error);
    }
});
*/

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.json());
app.use(express.static('public')); //all static files in 'public' folder will be accessible to the app
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads directory
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: '67b8621fc96406bd6cd2fc10',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // session timeout of 60 minutes
  }));

app.use(flash());

app.use((req, res, next) => {
    res.locals.message = req.flash("message");
    res.locals.error = req.flash("error");
    next();
});

app.use((req, res, next) => {
    console.log('Host: ', req.hostname + ' ' + req.path + ' ' + req.method);
    next();
});

app.get('/', async (req, res) => {
    const sessionData = req.session;

    if (!sessionData || !req.session.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
        const contributor = sessionData.contributor;
        if (!contributor) {
            console.warn("No contributor found in session.");
            return res.render('index', { title: "Home", sessionData, expectations: [] });
        }

        const pool = await getPool();
        const result = await pool.request()
                    .input('ContributorId', sql.Int, contributor.Id)
                    .query("SELECT * FROM expectations WHERE ContributorId = @ContributorId");
        const expectations = result.recordset; // await Expectation.find({ Contributor: contributor }).populate('Contributor Contribution');
        for (var i = 0; i < expectations.length; i++){
            const result1 = await pool.request()
            .input('Id', sql.Int, expectations[i].ContributionId)
            .query("SELECT * FROM contributions WHERE Id = @Id");
            expectations[i].Contribution = result1.recordset[0];
        }
        //console.log("expectations: ", expectations);

        res.render('index', { title: "Home", sessionData, expectations });
    } catch (err) {
        console.error("Error fetching expectations:", err);
        res.status(500).send("Server error");
    }
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About' });
});

app.get('/users', (req, res) => {
    res.redirect('/contributor');
});

app.use(authController);
app.use('/community', communityRoutes);
app.use('/group', groupRoutes);
app.use('/grouping', groupingRoutes);
app.use('/contribution', contributionRoutes);
app.use('/contributor', contributorRoutes);
app.use('/expense', expenseRoutes);
app.use('/expectation', expectationRoutes);

app.use('/auth/api', authapiController);
app.use('/community/api', communityapiController);

app.use((req, res) => {
    res.status(404).render('error', { title: 'Error' });
});