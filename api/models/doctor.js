const mongoose = require('mongoose');
const User = require('./user');

const statesArray = ["VIC", "NSW", "TAS", "SA", "ACT", "QLD", "WA", "NT"];

module.exports = mongoose.model('Doctor', new mongoose.Schema(
    {
        userID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        address: {
            street: String,
            city: String,
            state: {
                type: String,
                uppercase: true,
                enum: statesArray
            },
            postcode: Number
        },     
        //patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }));