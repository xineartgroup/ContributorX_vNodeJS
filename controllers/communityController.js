const Community = require('../models/community');

const communityIndex = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalCommunities = await Community.countDocuments();
        const communities = await Community.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.render('community/index', { 
            title: 'Community List', sessionData,
            communities, 
            currentPage: page,
            totalPages: Math.ceil(totalCommunities / limit)
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
};

const communityCreateGet = async (req, res) => {
    const sessionData = req.session;

    if (!sessionData || !req.session.isLoggedIn) {
        res.redirect('/login');
      }

    res.render('community/create', { title: 'New Community' });
};

const communityCreatePost = (req, res) => {
    const sessionData = req.session;

    if (!sessionData || !req.session.isLoggedIn) {
        res.redirect('/login');
      }

    const { Name, Description } = req.body;

    const community = new Community({
        Name,
        Description
    });

    community.save()
        .then(() => {
            res.redirect('/community');
        })
        .catch(err => {
            console.error("Error saving community:", err);
            res.status(500).send("Error saving community.");
        });
};

const communityUpdateGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const community = await Community.findById(req.params.id);
        if (!community) {
            return res.status(404).send('Community not found');
        }
        res.render('community/update', { title: 'Update Community', community });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const communityUpdatePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const updatedData = {
            Name: req.body.Name,
            Description: req.body.Description
        };

        await Community.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        res.redirect('/community');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err);
    }
};

const communityDeleteGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const community = await Community.findById(req.params.id);
        if (!community) {
            return res.status(404).send('Community not found');
        }
        res.render('community/delete', { title: 'Delete Community', community });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const communityDeletePost = async (req, res) => {
    const sessionData = req.session;

    if (!sessionData || !req.session.isLoggedIn) {
        res.redirect('/login');
      }

    await Community.findByIdAndDelete(req.params.id)
        .then(() => {
            res.redirect('/community');
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: "Error deleting community" });
        });
};

module.exports = {
    communityIndex,
    communityCreateGet,
    communityCreatePost,
    communityUpdateGet,
    communityUpdatePost,
    communityDeleteGet,
    communityDeletePost
};
