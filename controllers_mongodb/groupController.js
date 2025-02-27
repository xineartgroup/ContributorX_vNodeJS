const Group = require('../models/group');
const Community = require('../models/community');

const groupIndex = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalGroups = await Group.countDocuments();
        const groups = await Group.find().populate('Community').sort({ createdAt: -1 }).skip(skip).limit(limit);

        res.render('group/index', { 
            title: 'Group List', 
            groups, 
            currentPage: page,
            totalPages: Math.ceil(totalGroups / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupCreateGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const communities = await Community.find();
        res.render('group/create', { title: 'New Group', communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupCreatePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const { Name, Description, Community } = req.body;
        const group = new Group({ Name, Description, Community });
        await group.save();
        res.redirect('/group');
    } catch (err) {
        console.error("Error saving group:", err);
        res.status(500).send("Error saving group.");
    }
};

const groupUpdateGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const group = await Group.findById(req.params.id);
        const communities = await Community.find();
        if (!group) return res.status(404).send('Group not found');

        res.render('group/update', { title: 'Update Group', group, communities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupUpdatePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const updatedData = {
            Name: req.body.Name,
            Description: req.body.Description,
            Community: req.body.Community
        };

        await Group.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.redirect('/group');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupDeleteGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const group = await Group.findById(req.params.id).populate('Community');
        if (!group) return res.status(404).send('Group not found');

        res.render('group/delete', { title: 'Delete Group', group });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const groupDeletePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        await Group.findByIdAndDelete(req.params.id);
        res.redirect('/group');
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Error deleting group" });
    }
};

module.exports = {
    groupIndex,
    groupCreateGet,
    groupCreatePost,
    groupUpdateGet,
    groupUpdatePost,
    groupDeleteGet,
    groupDeletePost
};
