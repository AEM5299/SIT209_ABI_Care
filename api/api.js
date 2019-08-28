// Calling node package mongoose which is used to communicate with a remote MongoDB
const mongoose = require('mongoose');

// Calling node package express
const express = require('express');

// Calling user schema model
const User = require('./models/user');

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

const app = express();

//
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = process.env.PORT || 5000;

// api end points start

// api end points end

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
