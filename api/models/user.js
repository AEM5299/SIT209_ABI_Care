const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema(
    {
        user: 
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
            required: true
        },
        date: 
        {
            type: String,
            default: Date.now
        }
    }));