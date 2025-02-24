const express = require('express');
const session = require('express-session');

const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const communityRoutes = require('./routes/communityRoutes');
const groupRoutes = require('./routes/groupRoutes');
const groupingRoutes = require('./routes/groupingRoutes');
const contributorRoutes = require('./routes/contributorRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const expectationRoutes = require('./routes/expectationRoutes');

const Expectation = require('./models/expectation');

const app = express();

const dbURI = 'mongodb://localhost:27017/cbtr-mgr';

mongoose.set('strictQuery', false);

/*app.listen(3000);*/
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.json());
app.use(express.static('public')); //all static files in 'public' folder will be accessible to the app
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: '67b8621fc96406bd6cd2fc10',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // session timeout of 60 minutes
  }));

app.use((req, res, next) => {
    console.log('Host: ', req.hostname + ' ' + req.path + ' ' + req.method);
    next();
});

app.get('/', async (req, res) => { // Add 'async' to the function
    const sessionData = req.session;

    if (!sessionData || !req.session.isLoggedIn) {
        return res.redirect('/login'); // Ensure 'return' to prevent further execution
    }

    try {
        const contributor = sessionData.contributor;
        if (!contributor) {
            console.warn("No contributor found in session.");
            return res.render('index', { title: "Home", sessionData, expectations: [] });
        }

        // Await the query to get the actual array
        const expectations = await Expectation.find({ Contributor: contributor }).populate('Contributor Contribution');

        console.log("Number of expectations:", expectations.length); // Debugging output

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

app.use(authRoutes);
app.use('/community', communityRoutes);
app.use('/group', groupRoutes);
app.use('/contribution', contributionRoutes);
app.use('/contributor', contributorRoutes);
app.use('/expense', expenseRoutes);
app.use('/expectation', expectationRoutes);

app.use((req, res) => {
    res.status(404).render('error', { title: 'Error' });
});
