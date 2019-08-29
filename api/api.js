// Calling node package mongoose which is used to communicate with a remote MongoDB
const mongoose = require('mongoose');
// Calling node package express
const express = require('express');
// Calling user schema model
const User = require('./models/user');
const Device = require('./models/device');
// Calling bcrypt to encrpyt and decrypt the password in the MongoDB
const bcrypt = require('bcrypt');
// Calling the local strategy for authentication
const LocalStrategy = require('passport-local').Strategy;
// Calling passport required for authentication
const passport = require('passport');
// Calling body parser
const bodyParser = require('body-parser');
const faker = require('faker');
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
// Middleware for passport
app.use(passport.initialize());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
                            ? res.send(err)
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

//

app.post('/api/authenticate', (req, res, next) => {
    const { email, password } = req.body;
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
           const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5m' });
           return res.json({success: true, token});
        });
    })(req, res, next);

});

app.post('/api/device', (req, res) => {
    const {owner, name} = req.body;
    User.findById(owner, (err, user) => {
        if(err) return res.send('failed');
        if(!user) return res.send('failed');
        const device = new Device({name: name, owner: owner});
        device.save();
        res.send(device);
    })
})

app.get('/api/FakeDeviceData/:deviceid', passport.authenticate('jwt', {session: false}) , (req, res) => {
    const { deviceid } = req.params;
    Device.findById(deviceid, (err, device) => {
        if(err) return res.send("Failed");
        if(!device) return res.send("Device not found");
        if(device.owner != req.user.id) res.status(401).send('Unauthorized');
        const object = {date: faker.date.past(), bloodPressure: faker.random.number(500)};
        device.data.push(object);
        device.save()
        return res.send(device);
    });
});

app.get('*', (req, res) => {
    res.status(404).send("404 NOT FOUND");
})
// api end points end
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});

  