
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const communitySchema = new Schema({
    //id: { type:Schema.Types.ObjectId, required: true },
    Name: { type: String, required: true },
    Description: { type: String, required: true },
    DateCreated: { type: Date, required: true, default: Date.now() },
}, { timestamps: true });

const Community = mongoose.model('Community', communitySchema);
module.exports = Community;
