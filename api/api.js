const mongoose = require('mongoose');
const express = require('express');
// Importing our models
const User = require('./models/user');
const Device = require('./models/device');
// Importing what we use for encryption and authentication
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
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
                    email: user.email
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
    const { name, email, password } = req.body;
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
                password
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
                        return err
                            ? res.status(500).send(err)
                            : res.json({
                                success: true,
                                message: 'Created new user'
                            });
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
           return res.json({success: true, token});
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
        .then(device => {
            if(!device || toString(device.owner) !== toString(req.user.id)) return res.status(400).send('Unknown Device')
            if(toString(device.owner) == toString(req.user.id)) return res.json(device);
        })
        .catch(err => {
            return res.send(err);
        })

});

app.get('/api/users', passport.authenticate('jwt'), (req,res) => {
    User.find({usertype: 'doctor'})
        .then(users => {
            return res.send(users);
        })
        .catch(err => {
            return res.send(err);
        })
});

app.get('*', (req, res) => {
    res.status(404).send("404 NOT FOUND");
})
// api end points end

app.listen(port, () => {
    console.log(`connected to mongoDBURL = ${process.env.MONGO_URL}`);
    console.log(`listening on port ${port}`);
});