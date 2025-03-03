
let contributor = new Contributor({
    id: { type: Number, required: true },
    UserName: { type: String, required: true },
    Password: { type: String, required: true },
    FirstName: { type: String, required: true },
    LastName: { type: String, required: true },
    Email: { type: String, required: true },
    Role: { type: String, required: true },
    PhoneNumber: { type: String, required: true },
    Picture: { type: String, required: true },
    Community: { type: Number, ref: 'Community', required: true },
    IsActive: { type: Boolean, required: true, default: true },
    StartDate: { type: Date, required: true, default: Date.now() },
});

module.exports = contributor;