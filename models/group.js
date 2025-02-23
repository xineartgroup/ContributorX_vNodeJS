
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
    //id: { type:Schema.Types.ObjectId, required: true },
    Name: { type: String, required: true },
    Description: { type: String, required: true },
    Community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    DateCreated: { type: Date, required: true, default: Date.now() },
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
