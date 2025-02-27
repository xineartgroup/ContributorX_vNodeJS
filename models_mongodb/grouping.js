
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupingSchema = new Schema({
    //id: { type:Schema.Types.ObjectId, required: true },
    Contributor: { type: Schema.Types.ObjectId, ref: 'Contributor', required: true },
    Group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
}, { timestamps: true });

const Grouping = mongoose.model('Grouping', groupingSchema);
module.exports = Grouping;
