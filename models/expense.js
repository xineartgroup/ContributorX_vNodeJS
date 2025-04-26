
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const expenseSchema = new Schema({
    //id: { type:Schema.Types.ObjectId, required: true },
    Name: { type: String, required: true },
    Description: { type: String, required: true },
    DateCreated: { type: Date, required: true, default: Date.now() },
    AmountPaid: { type: Number, required: true },
    Community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    PaymentReceipt: { type: String, required: false, default: '' },
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;