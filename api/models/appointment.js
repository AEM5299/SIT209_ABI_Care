const mongoose = require('mongoose');

module.exports = mongoose.model('Appointment', new mongoose.Schema(
    {
        date: Date,
        slot: Number,
        patient: {type: mongoose.Schema.Types.ObjectId, ref:"User"},
        doctor: {type: mongoose.Schema.Types.ObjectId, ref:"User"},
    }));


/*
    slots:-
        1: 12 to 12:30 pm
        2: 12:30 to 1 pm
        3: 1 to 1:30 pm
*/