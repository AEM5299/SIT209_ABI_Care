const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema(
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
            default: 'patient'
        },
        date:
        {
            type: String,
            default: Date.now
        },
        doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }));