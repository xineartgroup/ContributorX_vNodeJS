
let expense = new Expense({
    id: { type: Number, required: true },
    Name: { type: String, required: true },
    Description: { type: String, required: true },
    DateCreated: { type: Date, required: true, default: Date.now() },
    AmountPaid: { type: Number, required: true },
    Community: { type: Number, ref: 'Community', required: true },
    PaymentReciept: { type: String, required: false, default: '' },
});

module.exports = expense;