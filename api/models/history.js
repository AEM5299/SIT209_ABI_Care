const mongoose = require('mongoose');

module.exports = mongoose.model('History', new mongoose.Schema(
    {
        details:
        {
            type: String,
            default:"Details about this entry"
        },
        patient: {type: mongoose.Schema.Types.ObjectId, ref:"User", required: true},
        doctor: {type: mongoose.Schema.Types.ObjectId, ref:"User", required: true},
        notes:
        {
            type: String,
            default: "Notes about this entry"
        },
        date:
        {
            type: String,
            default: Date.now
        },
    }));