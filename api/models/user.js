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
            required: false,
            default: 'patient'
        },
        date: 
        {
            type: String,
            default: Date.now
        }
    }));