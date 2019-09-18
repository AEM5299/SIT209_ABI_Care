const mongoose = require('mongoose');
const Doctor = require('./doctor');

var UserSchema = new mongoose.Schema(
    {
        name:
        {
            type: String,
            required: true
        },
        email:
        {
            type: String,
            required: true
        },
        password:
        {
            type: String,
            required: true
        },
        usertype:
        {
            type: String,
            required: true,
            enum: ['patient', 'doctor']
        },
        date:
        {
            type: String,
            default: Date.now
        },
        doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        history:[{}]
    });

UserSchema.methods.isDoctor = function isDocotr() {
    return this.usertype == 'doctor';
}

mongoose.model('User', UserSchema);
module.exports = mongoose.model('User')