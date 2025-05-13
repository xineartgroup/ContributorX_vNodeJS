const Contributor = require('../models/contributor');
const Contribution = require('../models/contribution');
const Community = require('../models/community');
const Expectation = require('../models/expectation');
const Group = require('../models/group');
const Grouping = require('../models/grouping');

const contributorIndex = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const page = parseInt(req.query.page) || 1;  // Default to page 1
        const limit = 10;  // Number of contributors per page
        const skip = (page - 1) * limit;
        
        const totalContributors = await Contributor.countDocuments();
        const contributors = await Contributor.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.render('contributor/index', { 
            title: 'Contributor List', 
            contributors, 
            currentPage: page,
            totalPages: Math.ceil(totalContributors / limit)
        });
    } catch (err) {
        console.log(err);
        res.send('Server Error');
    }
};

const contributorDetailGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const contributor = await Contributor.findById(req.params.id);
        const groups = await Group.find({ Community: contributor.Community });
        const groupingTemps = await Grouping.find({ Contributor: req.params.id });
        const expectationTemps = await Expectation.find({ Contributor: req.params.id });
        const groupHtml = AddGroup();
        if (contributor) {
            if (expectationTemps && groupingTemps){
                const expectations = await Promise.all(
                    expectationTemps.map(async (exp) => {
                        exp.Contribution = await Contribution.findById(exp.Contribution);
                        return exp;
                    })
                );
                const groupings = await Promise.all(
                    groupingTemps.map(async (exp) => {
                        exp.Group = await Group.findById(exp.Group);
                        return exp;
                    })
                );
                console.log("groupings: ", groupings);
                res.render('contributor/detail', { title: 'Contributor Detail', contributor, groups, groupings, expectations, groupHtml });
            }
        } else {
            return res.send('Contributor not found');
        }
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
}

const contributorDetailPost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const updatedData = {
            UserName: req.body.UserName,
            Password: req.body.Password,
            FirstName: req.body.FirstName,
            LastName: req.body.LastName,
            Email: req.body.Email,
            Role: req.body.Role,
            PhoneNumber: req.body.PhoneNumber,
            Picture: req.body.Picture,
            Community: req.body.Community,
            IsActive: req.body.IsActive === 'true'
        };

        await Contributor.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        res.redirect('/contributor'); // Redirect to list after updating
    } catch (err) {
        console.error(err);
        res.send('Server Error: ' + err);
    }
}

const contributorUpdateGet = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const contributor = await Contributor.findById(req.params.id);
        const communities = await Community.find();
        if (!contributor) {
            return res.send('Contributor not found');
        }
        res.render('contributor/update', { title: 'Update Contributor', contributor, communities });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
}

const contributorUpdatePost = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const updatedData = {
            UserName: req.body.UserName,
            Password: req.body.Password,
            FirstName: req.body.FirstName,
            LastName: req.body.LastName,
            Email: req.body.Email,
            Role: req.body.Role,
            PhoneNumber: req.body.PhoneNumber,
            Picture: req.file ? req.file.filename : req.body.Picture,
            Community: req.body.Community,
            IsActive: req.body.IsActive === 'true'
        };

        await Contributor.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        res.redirect('/contributor'); // Redirect to list after updating
    } catch (err) {
        console.error(err);
        res.send('Server Error: ' + err);
    }
}

const contributorUpdate1 = async (req, res) => {
    try {
        const sessionData = req.session;
    
        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
          }
    
        const { groups, id } = req.body; // Use req.body for POST
        
        if (!id) {
            return res.json({ message: "Contributor ID is required." });
        }

        // Convert comma-separated string to an array and remove empty values
        const groupNames = Array.isArray(groups) ? groups : groups.split(',').filter(name => name.trim() !== "");

        // Find group IDs based on names
        const groupDocs = await Group.find({ Name: { $in: groupNames } });

        if (groupDocs.length === 0) {
            return res.json({ message: "No valid groups found." });
        }

        const groupIds = groupDocs.map(group => group._id);

        let contributor = await Contributor.findById(id);
        if (!contributor) {
            return res.json({ message: "Contributor not found." });
        }

        // Update contributor's groups in the Grouping model
        await Grouping.deleteMany({ Contributor: id }); // Remove old groupings
        const newGroupings = groupIds.map(groupId => ({
            Contributor: contributor,
            Group: groupId
        }));

        await Grouping.insertMany(newGroupings);

        return res.send({ message: "Contributor updated successfully!" });

    } catch (error) {
        console.error(error);
        res.send({ message: "Server error" });
    }
};

const contributorCreateGet = async (req, res) => {
    try{
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
        }

        const communities = await Community.find();

        res.render('contributor/create', { title: 'New Contributor', communities });
    } catch(err) {
        console.error(err);
        res.send("Server Error.");
    };
}

const contributorCreatePost = (req, res) => {
    try{
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
        }

        const { UserName, Password, FirstName, LastName, Email, Role, PhoneNumber, Picture, Community } = req.body;

        const contributor = new Contributor({
            UserName,
            Password,
            FirstName,
            LastName,
            Email,
            Role,
            PhoneNumber,
            Picture: req.file ? req.file.filename : null,
            Community
        });

        contributor.save();
    } catch(err) {
        console.error("Error saving contributor:", err);
        res.send("Error saving contributor.");
    };
}

const contributorDeleteGet = async (req, res) => {
    try {
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
        }

        const contributor = await Contributor.findById(req.params.id).populate('Community');
        if (!contributor) {
            return res.send('Contributor not found');
        }
        res.render('contributor/delete', { title: 'Delete Contributor', contributor });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
}

const contributorDeletePost = async (req, res) => {
    try {
        const sessionData = req.session;

        if (!sessionData || !req.session.isLoggedIn) {
            res.redirect('/login');
        }

        await Contributor.findByIdAndDelete(req.params.id)
            .then((result) => {
                res.redirect('/contributor'); // Redirect to the list page
            })
            .catch((err) => {
                console.error(err);
                res.json({ error: "Error deleting contributor" });
            });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
}

const AddGroup = async () => {
    var result = "";
    const groupings = await Grouping.find();
    groupings.forEach (item => {
        if (item.Group != null)
        {
            result += item.Group.Name + "\n";
        }
        else
        {
            result += "\n";
        }
    });
    return result;
};

module.exports = {
    contributorIndex,
    contributorDetailGet,
    contributorDetailPost,
    contributorUpdateGet,
    contributorUpdatePost,
    contributorUpdate1,
    contributorCreateGet,
    contributorCreatePost,
    contributorDeleteGet,
    contributorDeletePost,
    AddGroup
}