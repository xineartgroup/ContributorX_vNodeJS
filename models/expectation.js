
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const expectationSchema = new Schema({
    //id: { type:Schema.Types.ObjectId, required: true },
    Contributor: { type: Schema.Types.ObjectId, ref: 'Contributor', required: true },
    Contribution: { type: Schema.Types.ObjectId, ref: 'Contribution', required: true },
    AmountPaid: { type: Number, required: true },
    AmountToApprove: { type: Number, required: true },
    PaymentStatus: { type: Number, required: true },
    PaymentReceipt: { type: String, required: false, default: '' },
}, { timestamps: true });

const Expectation = mongoose.models.Expectation || mongoose.model('Expectation', expectationSchema);
module.exports = Expectation;
