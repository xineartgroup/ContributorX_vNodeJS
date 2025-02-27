
let expectation = new Expectation({
    id: { type: Number, required: true },
    Contributor: { type: Number, ref: 'Contributor', required: true },
    Contribution: { type: Number, ref: 'Contribution', required: true },
    AmountPaid: { type: Number, required: true },
    AmountToApprove: { type: Number, required: true },
    PaymentStatus: { type: Number, required: true },
    PaymentReciept: { type: String, required: false, default: '' },
});

module.exports = expectation;
