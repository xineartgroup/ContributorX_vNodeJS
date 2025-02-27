
let grouping = new Grouping({
    id: { type: Number, required: true },
    Contributor: { type: Number, ref: 'Contributor', required: true },
    Group: { type: Number, ref: 'Group', required: true },
});

module.exports = grouping;
