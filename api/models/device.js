const mongoose = require('mongoose');
const User = require('./user');

module.exports = mongoose.model('Device', new mongoose.Schema(
    {
        name: String,
        owner: {type: mongoose.Schema.Types.ObjectId, ref:"User"},
        type: {type: String, enum: ['BPM', 'HRM', 'SLM ']},
        data: [{}]
    }));