const Contribution = require('../models/contribution');
const Expectation = require('../models/expectation');
const Grouping = require('../models/grouping');
const Group = require('../models/group');

const contributionIndex = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalContributions = await Contribution.countDocuments();
        const contributions = await Contribution.find().populate('Group').sort({ createdAt: -1 }).skip(skip).limit(limit);

        res.render('contribution/index', { 
            title: 'Contribution List', 
            contributions, 
            currentPage: page,
            totalPages: Math.ceil(totalContributions / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionCreateGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const groups = await Group.find();
        res.render('contribution/create', { title: 'New Contribution', groups });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionCreatePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const { Name, Amount, Group, DueDate } = req.body;
        const contribution = new Contribution({ Name, Amount, Group, DueDate });
        await contribution.save();

        const groupings = await Grouping.find({ Group }).populate('Contributor');

        for (const grouping of groupings) {
            const expectation = new Expectation({
                Contributor: grouping.Contributor,
                Contribution: contribution,
                PaymentStatus: 0,
                AmountPaid: 0.0,
                AmountToApprove: 0.0,
                PaymentReceipt: '',
            });
            await expectation.save();
        }        

        res.redirect('/contribution');
    } catch (err) {
        console.error("Error saving contribution:", err);
        res.status(500).send("Error saving contribution.");
    }
};

const contributionUpdateGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const contribution = await Contribution.findById(req.params.id);
        const groups = await Group.find();
        if (!contribution) return res.status(404).send('Contribution not found');

        res.render('contribution/update', { title: 'Update Contribution', contribution, groups });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionUpdatePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const updatedData = {
            Name: req.body.Name,
            Amount: req.body.Amount,
            Group: req.body.Group,
            DueDate: req.body.DueDate
        };

        await Contribution.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.redirect('/contribution');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionDeleteGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const contribution = await Contribution.findById(req.params.id).populate('Group');
        if (!contribution) return res.status(404).send('Contribution not found');

        res.render('contribution/delete', { title: 'Delete Contribution', contribution });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const contributionDeletePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        await Contribution.findByIdAndDelete(req.params.id);
        res.redirect('/contribution');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting contribution" });
    }
};

module.exports = {
    contributionIndex,
    contributionCreateGet,
    contributionCreatePost,
    contributionUpdateGet,
    contributionUpdatePost,
    contributionDeleteGet,
    contributionDeletePost
};