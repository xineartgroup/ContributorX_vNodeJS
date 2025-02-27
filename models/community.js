
let community = new Community({
    id: { type: Number, required: true },
    Name: { type: String, required: true },
    Description: { type: String, required: true },
    DateCreated: { type: Date, required: true, default: Date.now() },
});

module.exports = community;
