
let group = new Group({
    id: { type: Number, required: true },
    Name: { type: String, required: true },
    Description: { type: String, required: true },
    Community: { type: Number, ref: 'Community', required: true },
    DateCreated: { type: Date, required: true, default: Date.now() },
});

module.exports = group;
