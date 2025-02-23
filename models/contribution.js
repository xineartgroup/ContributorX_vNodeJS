
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contributionSchema = new Schema({
    //id: { type:Schema.Types.ObjectId, required: true },
    Name: { type: String, required: true },
    Amount: { type: Number, required: true },
    Group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    DateCreated: { type: Date, required: true, default: Date.now() },
    DueDate: { type: Date, required: true, default: Date.now() },
}, { timestamps: true });

const Contribution = mongoose.model('Contribution', contributionSchema);
module.exports = Contribution;