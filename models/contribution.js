
let contribution = new Contribution({
    id: { type: Number, required: true },
    Name: { type: String, required: true },
    Amount: { type: Number, required: true },
    Group: { type: Number, ref: 'Group', required: true },
    DateCreated: { type: Date, required: true, default: Date.now() },
    DueDate: { type: Date, required: true, default: Date.now() },
});

module.exports = contribution;