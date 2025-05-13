const Grouping = require('../models/grouping');
const Contributor = require('../models/contributor');
const Group = require('../models/group');

const groupingIndex = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalGroupings = await Grouping.countDocuments();
        const groupings = await Grouping.find()
            .populate('Contributor')
            .populate('Group')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.render('grouping/index', { 
            title: 'Grouping List', 
            groupings, 
            currentPage: page,
            totalPages: Math.ceil(totalGroupings / limit)
        });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

const groupingCreateGet = async (req, res) => {
    try {
        const contributors = await Contributor.find();
        const groups = await Group.find();
        res.render('grouping/create', { title: 'New Grouping', contributors, groups });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

const groupingCreatePost = async (req, res) => {
    try {
        const { Contributor, Group } = req.body;
        const grouping = new Grouping({ Contributor, Group });
        await grouping.save();
        res.redirect('/grouping');
    } catch (err) {
        console.error("Error saving grouping:", err);
        res.send("Error saving grouping.");
    }
};

const groupingUpdateGet = async (req, res) => {
    try {
        const grouping = await Grouping.findById(req.params.id);
        const contributors = await Contributor.find();
        const groups = await Group.find();
        if (!grouping) return res.send('Grouping not found');

        res.render('grouping/update', { title: 'Update Grouping', grouping, contributors, groups });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

const groupingUpdatePost = async (req, res) => {
    try {
        const updatedData = {
            Contributor: req.body.Contributor,
            Group: req.body.Group
        };

        await Grouping.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.redirect('/grouping');
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

const groupingDeleteGet = async (req, res) => {
    try {
        const grouping = await Grouping.findById(req.params.id).populate('Contributor').populate('Group');
        if (!grouping) return res.send('Grouping not found');

        res.render('grouping/delete', { title: 'Delete Grouping', grouping });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

const groupingDeletePost = async (req, res) => {
    try {
        await Grouping.findByIdAndDelete(req.params.id);
        res.redirect('/grouping');
    } catch (err) {
        console.error(err);
        res.send({ error: "Error deleting grouping" });
    }
};

module.exports = {
    groupingIndex,
    groupingCreateGet,
    groupingCreatePost,
    groupingUpdateGet,
    groupingUpdatePost,
    groupingDeleteGet,
    groupingDeletePost
};
