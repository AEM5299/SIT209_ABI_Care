// Calling node package mongoose which is used to communicate with a remote MongoDB
const mongoose = require('mongoose');
// Calling node package express
const express = require('express');
// Calling user schema model
const User = require('./models/user');
// Calling bcrypt to encrpyt and decrypt the password in the MongoDB
const bcrypt = require('bcrypt');
// Calling the local strategy for authentication
const LocalStrategy = require('passport-local').Strategy;
// Calling passport required for authentication
const passport = require('passport');
// Calling body parser
const bodyParser = require('body-parser');
// Connecting to mongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
// Creating an instance of express() named app
const app = express();

// Middleware for bodyparser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
// Middleware for passport
app.use(passport.initialize());
app.use(passport.session());

// Defining a port 5000 or env.PORT from .env
const port = process.env.PORT || 5000;

passport.use(
    new LocalStrategy({usernameField: 'email', passwordField: 'password'}, (email, password, done) =>{
        // Matching email
        User.findOne({ email: email})
            .then(user => {
                if(!user){
                    return done(null, false, { message: 'Email not registered'}); 
                }

                // Matching the password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if(err)
                        throw err;
                    if(isMatch)
                        return done(null, user);
                    else
                    {
                        return done(null,false, { message: 'Password is incorrect'});
                    }
                });
            })
            .catch(err => console.log(err));
    })
);

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
    const { user, email, password, usertype } = req.body;
    User.findOne({ "email": email }, (err, users) => {
        if (err) {
            console.log("Information incorrect");
            return res.send(err);
        }
        else if (users != null) {
            if (users.email == email) {
                console.log("This email is already registered");
                return res.send("This email is already registered");
            }
        }
        else 
        {
            const newUser = new User({
                user,
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
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    })(req, res, next);

});
// api end points end

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});

  