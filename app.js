const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require("connect-flash");
const cookieParser = require('cookie-parser');

/*const mongoose = require('mongoose');*/
const authController = require('./controllers/authController');
const communityController = require('./controllers/communityController');
const contributionController = require('./controllers/contributionController');
const groupController = require('./controllers/groupController');
const expenseController = require('./controllers/expenseController');
const contributorController = require('./controllers/contributorController');
const groupingController = require('./controllers/groupingController');
const expectationController = require('./controllers/expectationController');

const authapiController = require('./middleware/authAPIController');
const communityapiController = require('./middleware/communityAPIController');
const contributionapiController = require('./middleware/contributionAPIController');
const groupapiController = require('./middleware/groupAPIController');
const expenseapiController = require('./middleware/expenseAPIController');
const contributorapiController = require('./middleware/contributorAPIController');
const groupingapiController = require('./middleware/groupingAPIController');
const expectationapiController = require('./middleware/expectationAPIController');

const { makeApiRequest } = require("./controllers/_baseController");

const app = express();

app.listen(3000);

/*
const dbURI = 'mongodb://localhost:27017/cbtr-mgr';

mongoose.set('strictQuery', false);

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));
*/

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.json());
app.use(express.static('public')); //all static files in 'public' folder will be accessible to the app
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads directory
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
    res.locals.session = req.session;  // Makes session available in all views
    next();
});

app.use((req, res, next) => {
    console.log('Host: ', req.hostname + ' ' + req.path + ' ' + req.method);
    next();
});

app.get('/', async (req, res) => {
    if (!req.session || !req.session.isLoggedIn) return res.redirect('/login');

    try {
        const contributor = req.session.contributor;
        if (!contributor) {
            return res.render('error', { title: 'Error', message: "No contributor found in session.", expectations: [] });
        }

        let searchValue = req.query.searchValue != null && req.query.searchValue != '' ? encodeURIComponent(req.query.searchValue) : "*";

        const result = await makeApiRequest('GET', `/expectation/api/getbycontributor/${contributor.Id}/${searchValue}`, req.headers.cookie);

        searchValue = decodeURIComponent(searchValue);
        if (searchValue == "*") searchValue = "";

        res.render('index', { title: "Home", message: "", expectations: result.expectations, searchValue });
    } catch (err) {
        res.render('error', { title: 'Error', message: `Page '${req.url}' not found.`, expectations: [] });
    }
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About' });
});

app.get('/users', (req, res) => {
    res.redirect('/contributor');
});

app.use(authController);
app.use('/communities', communityController);
app.use('/contributions', contributionController);
app.use('/group', groupController);
app.use('/expense', expenseController);
app.use('/contributor', contributorController);
app.use('/grouping', groupingController);
app.use('/expectation', expectationController);

app.use('/auth/api', authapiController);
app.use('/communities/api', communityapiController);
app.use('/contributions/api', contributionapiController);
app.use('/group/api', groupapiController);
app.use('/expense/api', expenseapiController);
app.use('/contributor/api', contributorapiController);
app.use('/grouping/api', groupingapiController);
app.use('/expectation/api', expectationapiController);

app.use((req, res) => {
    res.render('error', { title: 'Error', message: `Page '${req.url}' not found.` });
});