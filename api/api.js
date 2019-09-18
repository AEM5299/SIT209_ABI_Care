const mongoose = require('mongoose');
const express = require('express');
// Importing our models
const User = require('./models/user');
const Device = require('./models/device');
const Doctor = require('./models/doctor');
const Appointment = require('./models/appointment');
const History = require('./models/history');
// Importing what we use for encryption and authentication
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

// Connecting to mongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
// Creating an instance of express() named app
const app = express();

// Middleware for bodyparser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
// Initializing passport
app.use(passport.initialize());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept Access-Control-Allow-Headers, Authorization, X-Requested-With");
    next();
});

// Defining a port 5000 or env.PORT from .env
const port = process.env.PORT || 5000;

passport.use(
    new LocalStrategy({usernameField: 'email', passwordField: 'password'}, (email, password, done) => {
        // Matching email
        User.findOne({email: email})
            .then(user => {
                if(!user){
                    return done(null, false, { message: 'Wrong Credentials'});
                }

                // Matching the password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if(err)
                        throw err;
                    if(isMatch)
                        return done(null, user);
                    else
                    {
                        return done(null,false, { message: 'Wrong Credentials'});
                    }
                });
            })
            .catch(err => console.log(err));
    })
);

passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey   : process.env.JWT_SECRET
    },
    (jwtPayload, cb) => {
        return User.findById(jwtPayload.id)
            .then(user => {
                return cb(null, {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    userType: user.usertype
                });
            })
            .catch(err => {
                return cb(err);
            });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
});

// api end points start

app.post('/api/registration', (req, res) => {
    const { name, email, password, usertype } = req.body;
    const {streetaddress, city, state, postcode} = req.body;
    if(usertype == 'doctor') {
        if(!streetaddress || !city || !state || !postcode) {
            return res.status(400).send("Incomplete information");
        }
    }
    User.findOne({ "email": email }, (err, users) => {
        if (err) {
            console.log("Information incorrect");
            return res.status(500).send(err);
        }
        else if (users != null) {
            if (users.email == email) {
                console.log("This email is already registered");
                return res.status(400).send("This email is already registered");
            }
        }
        else
        {
            const newUser = new User({
                name,
                email,
                password,
                usertype
            });

            // Hashing Password in mongoDB
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt , (err, hash) => {
                    if(err)
                        throw err;
                    // Set the password to the hash form
                    newUser.password = hash;
                    // Saving the user
                    newUser.save(err => {
                        if (err) res.status(500).send(err);
                        if (usertype == 'patient') res.json({
                            success: true,
                            message: 'Created new user'
                        });
                        else {
                            doctor = new Doctor({userID: newUser._id, address: {street: streetaddress, city: city, state: state, postcode: parseInt(postcode)}});
                            doctor.save(err => {
                                return err ?
                                    res.status(500).send(err)
                                    : res.json({
                                        success: true,
                                        message: 'Created new Doctor'
                                    });
                            });
                        }
                    });

                })
            })
            console.log("Registered a new user");
        }
    });
});

app.post('/api/authenticate', (req, res, next) => {
    passport.authenticate('local', {session: false}, (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({
                success: false,
                message: info.message,
            });
        }
        req.login(user, {session: false}, (err) => {
           if (err) {
               res.send(err);
           }
           const payload = {id: user._id, email: user.email};
           const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
           return res.json({success: true, token, usertype: user.usertype});
        });
    })(req, res, next);

});

app.get('/api/devices', passport.authenticate('jwt'), (req, res) => {
    Device.find({owner: req.user.id})
        .then(devices => {
            return res.send(devices);
        })
        .catch(err => {
            return res.send(err);
        })

});

app.post('/api/devices', passport.authenticate('jwt'), (req, res) => {
    const {name, type} = req.body;
    User.findById(req.user.id)
    .then(user => {
        if(!user) return res.send('failed');
        const newDevice = new Device({
            name: name,
            type: type,
            owner: req.user.id
        });
        newDevice.save(err => {
            return err
                ? res.send(err)
                : res.json({
                    newDevice: newDevice,
                    success: true
                });
        });
    })
    .catch(err => {
        return res.send('failed');
    });

});

app.get('/api/devices/:deviceId', passport.authenticate('jwt'), (req, res) => {
    const { deviceId } = req.params;
    Device.findById(deviceId)
        .select({ data: 1, name: 1, type: 1 })
        .then(device => {
            if(!device || toString(device.owner) !== toString(req.user.id)) return res.status(400).send('Unknown Device')
            if(toString(device.owner) == toString(req.user.id)) return res.json(device);
        })
        .catch(err => {
            return res.send(err);
        })

});

app.get('/api/doctors', (req,res) => {
    Doctor.find({})
    .select({address: 1, userID: 1, _id: 1})
    .populate('userID', 'name')
    .then(doctors => {
        return res.json(doctors);
    })
    .catch(err => {
        return res.send(err);
    })
});

app.get('/api/doctors/:doctorId', passport.authenticate('jwt'), (req, res) => {

});

app.get('/api/patients', passport.authenticate('jwt'), (req,res) => {
    if(req.user.userType != 'doctor') {
        return res.status(401).send('Unauthorized');
    }
    Doctor.find({userID: req.user.id})
        .select({paitents:1})
        .populate('paitents', 'name')
        .populate('paitents', 'email')
        .then(user => {
            console.log(user);
            return res.json(user);            
        })
        .catch(err => {
            return res.send(err);
        })
})

app.get('/api/patients/:patientId', passport.authenticate('jwt'), (req, res) => {

});

app.post('/api/appointment', passport.authenticate('jwt'), (req, res) => {
    const { date, slot, doctorid } = req.body;
    Appointment.findOne({doctor: doctorid, date, slot})
    .then(appointment => {
        if(appointment) return res.send("Appointment Already filled");
        if(!appointment) {
            const newAppointment = new Appointment({
                date,
                slot,
                doctor: doctorid,
                patient: req.user.id
            })
            newAppointment.save((err, result) => {
                if(err) return res.send(err);
                else return res.send('Appointment made');
            })
        }
    })
    .catch(err => {
        return res.send(err);
    })
})

app.get('/api/appointment', passport.authenticate('jwt'), (req, res) => {
    if(req.user.userType != 'doctor') {
        return res.status(401).send('Unauthorized');
    }
    Appointment.find({doctor: req.user.id})
    .populate('patient', 'name')
    .sort({ date: 1, slot: 1 })
    .then(appointments => {
        res.json(appointments);
    })
    .catch(err => {
        return res.send(err);
    })
})

app.get('/api/history', passport.authenticate('jwt'), (req, res) => {

});

app.post('/api/history', passport.authenticate('jwt'), (req, res) => {
    if(req.user.userType != 'doctor') {
        return res.status(401).send('Unauthorized');
    }
    const {details, doctorsEmail, patientsEmail, notes, date} = req.body;
    User.find({email: patientsEmail})
    .then(user => {
        if(!user) return res.send('no such paitient exists');
        const newHistory = new History({
            details: details,
            doctorsEmail: doctorsEmail,
            patientsEmail: patientsEmail,
            doctor: req.user.id,
            patient: user._id,
            notes: notes,
            date: date
        });
        newHistory.save(err => {
            return err
                ? res.send(err)
                : res.json({
                    newDevice: newHistory,
                    success: true
                });
        });
    })
    .catch(err => {
        return res.send('failed');
    });
});

app.get('*', (req, res) => {
    res.status(404).send("404 NOT FOUND");
})
// api endpoints end

app.listen(port, () => {
    console.log(`connected to mongoDBURL = ${process.env.MONGO_URL}`);
    console.log(`listening on port ${port}`);
});