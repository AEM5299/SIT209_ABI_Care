// Importing mongoose,express and bodyparser
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');

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
const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

// Importaing nodemailer
const mailer = require('nodemailer');

// Connecting to mongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

// Transporter for mail
const transporter = mailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
    }
});

// Creating an instance of express named app
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

// Defining the passport local strategy
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

// Defining the JWTStrategy
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

// Serialisation code
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialisation code
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
});

// Function for sending notification
async function sendNotification(appointment) {
    Appointment.findById(appointment._id)
    .populate('patient', 'name email')
    .populate('doctor', 'name email')
    .then(appointment => {
        transporter.sendMail({
            from: '"ABI Care" <ABICare@example.com>',
            to: appointment.patient.email,
            subject: `Your appointment with Dr. ${appointment.doctor.name}`,
            text: `Hi, You have a new appointment with Dr. ${appointment.doctor.name} on ${appointment.date.toString().slice(0, 15)}.`,
            html: `Hi,<br><br>You have a new appointment with Dr. ${appointment.doctor.name} on ${appointment.date.toString().slice(0, 15)}.<br><br> Thankyou,<br>ABI Care`
        }, err => {
            if(err) console.log(err);
        });
    })
}

// api end points start

/** 
 * @api {post} /api/registration Register a new user
 * @apiGroup User
 * @apiDescription Registers a new user and redirects to the login page if successful
 * @apiSampleRequest https://abi-care-api.herokuapp.com/api/registration
 * @apiParam (patient) {String} Name Name of the user
 * @apiParam (patient) {String} Email Email of the user
 * @apiParam (patient) {String{6..}} Password Password of the user
 * @apiParam (patient) {String} Usertype Usertype of the user
 * @apiParam (doctor) {String} Name Name of the user
 * @apiParam (doctor) {String} Email Email of the user
 * @apiParam (doctor) {String{6..}} Password Password of the user
 * @apiParam (doctor) {String} Usertype Usertype of the user
 * @apiParam (doctor) {String} StreetAddress Address of the user
 * @apiParam (doctor) {String} City City the user resides in
 * @apiParam (doctor) {String} State State the user resides in
 * @apiParam (doctor) {int} Postcode Postcode of the user
 * @apiParamExample {json} Patient-Request-Example:
 * {
 *   "User": "test",
 *   "Email: test@email.com",
 *   "Password": "test123",
 *   "Usertype": "patient"
 * }
 * @apiParamExample {json} Doctor-Request-Example:
 * {
 *   "User": "test",
 *   "Email: test@email.com",
 *   "Password": "test123",
 *   "Usertype": "doctor",
 *   "StreetAdress": "123 Street Name",
 *   "City": "City Name",
 *   "State": "State Name",
 *   "Postcode": "1234"
 * }
 * @apiSuccess (200 Success) {String} PatientCreated New Patient Created
 * @apiSuccess (200 Success) {String} DoctorCreated New Doctor Created
 * @apiSuccessExample {json} Patient-Created-Response-Example:
 *   HTTP/1.1 200 OK
 *   {
 *       "success": "true",
 *       "message": "Created new Patient"
 *   }
 * @apiSuccessExample {json} Doctor-Created-Response-Example:
 *   HTTP/1.1 200 OK
 *   {
 *       "success": "true",
 *       "message": "Created new Doctor"
 *   }
 * @apiError (400 Error) {String} IncompleteInformation Some information is incomplete
 * @apiError (400 Error) {String} IncorrectInformation Given information is incorrect
 * @apiError (400 Error) {String} EmailAlreadyRegistered Given Email is already registered                          
 * @apiErrorExample {json} IncompleteInformation-Response-Example:
 *   HTTP/1.1 400 Bad Request
 *   {
 *       "Incomplete information"  
 *   }
 * @apiErrorExample {json} IncorrectInformation-Response-Example:
 *   HTTP/1.1 400 Bad Request
 *   {
 *       "Information incorrect"  
 *   }
 * @apiErrorExample {json} EmailAlreadyRegistered-Response-Example:
 *   HTTP/1.1 400 Bad Request
 *   {
 *       "This email is already registered"  
 *   }   
 * @apiError (500 Error) {String} ServerError Something went wrong serverside  
 * @apiErrorExample {json} ServerError-Response-Example:
 *   HTTP/1.1 500 Internal Error
 *   {
 *       "Something went wrong serverside"  
 *   }      
*/
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
            return res.status(400).send(err);
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
                            message: 'Created new Patient'
                        });
                        else {
                            doctor = new Doctor({userID: newUser._id, address: {street: streetaddress, city: city, state: state, postcode: parseInt(postcode)}});
                            doctor.save(err => {
                                return err ?
                                    res.status(500).send(err)
                                    : res.status(200).json({
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

/** 
* @api {post} /api/authenticate Authenticate the user
* @apiGroup User
* @apiDescription Authenticates the user and redirects to the login page if successful
* @apiSampleRequest https://abi-care-api.herokuapp.com/api/authenticate 
*
*
*/
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

/**
 * @api {get} /api/devices Retrieve all devices
 * @apiGroup Device
 * @apiDescription Retrieve all the devices registered to the current user
 * @apiSuccess (200 Success) {String} DevicesRetrieved All devices retrieved
 * @apiSuccessExample {json} DevicesRetrieved-Response-Example:
 *   HTTP/1.1 200 OK
 *   {
 *       name: "test-device",
 *       owner: "5d73ba97c3756200048cbe85",
 *       type: "HRM",
 *       data: "[
 *              0:
 *                  0: "2019/02/08"
 *                  1: "1234"
 *              1:
 *                  0: "2019/08/08"
 *                  1: "22"
 *              ]"
 *   }
 * @apiError (400 Error) {String} UserNotFound Could not found user in the database
 * @apiErrorExample {json} UserNotFound-Response-Example:
 *   HTTP/1.1 400 Bad request
 *   {
 *       "Could not found user in the database"  
 *   }
 * @apiError (500 Error) {String} ServerError Something went wrong serverside 
 * @apiErrorExample {json} ServerError-Response-Example:
 *  HTTP/1.1 500 Internal Error
 *  {
 *      "Something went wrong serverside"  
 *  }   
*/
app.get('/api/devices', passport.authenticate('jwt'), (req, res) => {
    Device.find({owner: req.user.id})
        .then(devices => {
            return res.status(200).send(devices);
        })
        .catch(err => {
            return res.status(500).send(err);
        })

});

/** 
 * @api {post} /api/devices Create a new Device
 * @apiGroup Device
 * @apiDescription Create a new device out of the options for the current user.
 * @apiParam  {String} Name Name of the user
 * @apiParam  {String} DeviceType Type of the device out of the supported options
 * @apiParamExample {json} Patient-Request-Example:
 * {
 *   "User": "test",
 *   "DeviceType": "BPM"
 * }
 * @apiSuccess (200 Success) {String} DeviceCreated New Device Created
 * @apiSuccessExample {json}  DeviceCreated-Response-Example:
 *  HTTP/1.1 200 OK
 *  {
 *      "newDevice": "newDevice",
 *      "success": "true"
 *  }
 * @apiError (400 Error) {String} UserNotFound User doesn`t exist in the database   
 * @apiErrorExample {json} UserNotFound-Response-Example:
 *  HTTP/1.1 400 Bad Request
 *  {
 *      "Cannot find the user"
 *  }
 * @apiError (500 Error) {String} ServerError Something went wrong serverside 
 * @apiErrorExample {json} ServerError-Response-Example:
 *  HTTP/1.1 500 Internal Error
 *  {
 *      "Something went wrong serverside"  
 *  }  
*/
app.post('/api/devices', passport.authenticate('jwt'), (req, res) => {
    const {name, type} = req.body;
    User.findById(req.user.id)
    .then(user => {
        if(!user) return res.status(400).send('Cannot find the user');
        const newDevice = new Device({
            name: name,
            type: type,
            owner: req.user.id
        });
        newDevice.save(err => {
            return err
                ? res.status(500).send(err)
                : res.status(200).json({
                    newDevice: newDevice,
                    success: true
                });
        });
    })
    .catch(err => {
        return res.status(500).send(err);
    });

});

/**
 * @api {get} /api/devices/:deviceId Retrieve a specific device
 * @apiGroup Device
 * @apiDescription Retrieve a specific device for the current user from the database.
 * @apiParam  {String} deviceId Id of the device to be retrieved 
 * @apiParamExample {json} Patient-Request-Example:
 * {
 *   "deviceId": "5d73ba97c3756200048cbe85"
 * }
 * @apiSuccess (200 Success) {String} DeviceRetrieved Device retrieved from the database
 * @apiSuccessExample {json}  DeviceRetrieved-Response-Example:
 *   HTTP/1.1 200 OK
 *   {
 *       name: "test-device",
 *       owner: "5d73ba97c3756200048cbe85",
 *       type: "HRM",
 *       data: "[
 *              0:
 *                  0: "2019/02/08"
 *                  1: "1234"
 *              1:
 *                  0: "2019/08/08"
 *                  1: "22"
 *              ]"
 *   }
 * @apiError (400 Error) {String} UnknownDevice Device doesn`t exist in the database  
 * @apiErrorExample {json} UnknownDevice-Response-Example:
 *  HTTP/1.1 400 Bad Request
 *  {
 *      "Device doesn`t exist in the database"
 *  }
 * @apiError (500 Error) {String} ServerError Something went wrong serverside   
 * @apiErrorExample {json} ServerError-Response-Example:
 *  HTTP/1.1 500 Internal Error
 *  {
 *      "Something went wrong serverside"  
 *  }  
*/
app.get('/api/devices/:deviceId', passport.authenticate('jwt'), (req, res) => {
    const { deviceId } = req.params;
    Device.findById(deviceId)
        .select({ data: 1, name: 1, type: 1 })
        .then(device => {
            if(!device || toString(device.owner) !== toString(req.user.id)) return res.status(400).send('Unknown Device')
            if(toString(device.owner) == toString(req.user.id)) return res.status(200).json(device);
        })
        .catch(err => {
            return res.status(500).send(err);
        })
});

/**
 * @api {get} /api/doctors Retrieve all doctors
 * @apiGroup User
 * @apiDescription Retrieve all the doctors registered in the database
 * @apiSuccess (200 Success) {String} DoctorsRetrieved All Doctors retrieved from the database
 * @apiSuccessExample {json}  DoctorsRetrieved-Response-Example:
 *  HTTP/1.1 200 OK
 *  {
 *
 *  }
 * @apiError (500 Error) {String} ServerError Something went wrong serverside   
 * @apiErrorExample {json} ServerError-Response-Example:
 *  HTTP/1.1 500 Internal Error
 *  {
 *      "Something went wrong serverside"  
 *  }  
*/
app.get('/api/doctors', (req,res) => {
    Doctor.find({})
    .select({address: 1, userID: 1, _id: 1})
    .populate('userID', 'name')
    .then(doctors => {
        return res.status(200).json(doctors);
    })
    .catch(err => {
        return res.status(500).send(err);
    })
});

/**
 * @api {get} /api/patients Retrieve all paitents
 * @apiGroup User
 * @apiDescription Retrieve all the paitents registered to the current logged-in doctor 
 * @apiSuccess (200 Success) {String} PatientsRetrieved Patients retrieved from the database
 * @apiSuccessExample {json}  PatientsRetrieved-Response-Example:
 *  HTTP/1.1 200 OK
 *  {
 *  
 *  }
 * @apiError (401 Error) {String} Unauthorized User is unauthorized 
 * @apiErrorExample {json} Unauthorized-Response-Example:
 *  HTTP/1.1 401 Unauthorized
 *  {
 *      "Device doesn`t exist in the database"
 *  }
 * @apiError (500 Error) {String} ServerError Something went wrong serverside 
 * @apiErrorExample {json} ServerError-Response-Example:
 *  HTTP/1.1 500 Internal Error
 *  {
 *      "Something went wrong serverside"  
 *  }  
*/
app.get('/api/patients', passport.authenticate('jwt'), (req,res) => {
    if(req.user.userType != 'doctor') {
        return res.status(401).send('Unauthorized');
    }
    Doctor.find({userID: req.user.id})
        .select({paitents:1})
        .populate('patients', 'name email')
        .then(patients => {
            console.log(patients);
            return res.status(200).json(patients);
        })
        .catch(err => {
            return res.status(500).send(err);
        })
})

app.get('/api/patients/:patientId', passport.authenticate('jwt'), (req, res) => {
    res.send('Not Implemented Yet');
});

/**
 * @api {post} /api/appointment Make an appointment
 * @apiGroup Appointment
 * @apiDescription Make a new appointment with your doctor.
 * @apiParam  {String} Date Date the appointment is to be made
 * @apiParam  {int} Slot Selection slot of the appointment
 * @apiParam  {String} doctorId Id of the doctor with whom appointment is to be made  
 * @apiParamExample {json} Appointment-Request-Example:
 * {
 *  "Date": "2019-09-19T00:00:00.000+00:00", 
 *  "Slot": 3, 
 *  "doctorId": "5d73ba97c3756200048cbe85"
 * }
 * @apiSuccess (200 Success) {String} AppointmentMade Appointmnet made with the doctor
 * @apiSuccessExample {json}  AppointmentMade-Response-Example:
 *  HTTP/1.1 200 OK
 *  {
 *      "Appointment made"
 *  }
 * @apiError (400 Error) {String} AppointmnetFilled Appointment Already filled
 * @apiErrorExample {json} AppointmentFilled-Response-Example:
 *  HTTP/1.1 400 Bad Request
 *  {
 *      "Appointment Already filled"
 *  }
 * @apiError (500 Error) {String} ServerError Something went wrong serverside 
 * @apiErrorExample {json} ServerError-Response-Example:
 *  HTTP/1.1 500 Internal Error
 *  {
 *      "Something went wrong serverside"  
 *  }  
*/
app.post('/api/appointment', passport.authenticate('jwt'), (req, res) => {
    const { date, slot, doctorid } = req.body;
    Appointment.findOne({doctor: doctorid, date, slot})
    .then(appointment => {
        if(appointment) return res.status(400).send("Appointment Already filled");
        if(!appointment) {
            const newAppointment = new Appointment({
                date,
                slot,
                doctor: doctorid,
                patient: req.user.id
            })
            newAppointment.save((err, result) => {
                if(err) return res.status(500).send(err);
                else {
                    res.status(200).send('Appointment made');
                    return sendNotification(result);
                }
            })
        }
    })
    .catch(err => {
        return res.status(500).send(err);
    })
})

/**
 * @api {get} /api/appointment Retrieve all appointments
 * @apiGroup Appointment 
 * @apiDescription Retrieve all the appointments for the current logged in doctor
 * @apiSuccess (200 Success) {String} AppointmentsRetrieved Appointments retrieved from the database
 * @apiSuccessExample {json}  AppointmentsRetrieved-Response-Example:
 *  HTTP/1.1 200 OK
 *  {
 *      "_id": "5d798ec109ecdc16df0f9973",
 *      "date": "2019-09-13T00:00:00.000+00:00",
 *      "slot": 1,
 *      "doctor": "5d798dc63bc1121663d863cb",
 *      "patient": "5d67108ec015f61ed413444d"
 *  }
 * @apiError (401 Error) {String} Unauthorized User is unauthorized 
 * @apiErrorExample {json} Unauthorized-Response-Example:
 *  HTTP/1.1 401 Unauthorized
 *  {
 *      "Invalid Usertype, only a doctor can make this request"
 *  }
 * @apiError (500 Error) {String} ServerError Something went wrong serverside 
 * @apiErrorExample {json} ServerError-Response-Example:
 *  HTTP/1.1 500 Internal Error
 *  {
 *      "Something went wrong serverside"  
 *  }  
 */
app.get('/api/appointment', passport.authenticate('jwt'), (req, res) => {
    if(req.user.userType != 'doctor') {
        return res.status(401).send('Unauthorized');
    }
    Appointment.find({doctor: req.user.id})
    .populate('patient', 'name')
    .sort({ date: 1, slot: 1 })
    .then(appointments => {
        res.status(200).json(appointments);
    })
    .catch(err => {
        return res.status(500).send(err);
    })
})

/**
 * @api {get} /api/history Retrieve medical history
 * @apiGroup MedicalHistory
 * @apiDescription Retrieve medical history for the current logged-in user
 * @apiSuccess (200 Success) {String} HistoryRetrieved Medical history retrieved from the database
 * @apiSuccessExample {json}  HistoryRetrieved-Response-Example:
 *  HTTP/1.1 200 OK
 *  {
 *      "_id":"5d820452211349a8d1f5c0cf",
 *      "details":"Test details",
 *      "notes":"test notes",
 *      "doctor": "5d798dc63bc1121663d863cb",
 *      "patient": "5d67108ec015f61ed413444d",
 *      "date":"18/09/2019"
 *  }
 * @apiError (500 Error) {String} ServerError Something went wrong serverside 
 * @apiErrorExample {json} ServerError-Response-Example:
 *  HTTP/1.1 500 Internal Error
 *  {
 *      "Something went wrong serverside"  
 *  }  
 */
app.get('/api/history', passport.authenticate('jwt'), (req, res) => {
    if(req.user.userType == 'doctor')
    {
        History.find({doctor: req.user.id})
        .then(history =>{
            return res.status(200).json(history);
        })
        .catch(err => {
            return res.status(500).send(err);
        })
    }
    else if(req.user.userType == 'patient')
    {
        History.find({patient: req.user.id})
        .then(history =>{
            return res.status(200).json(history);
        })
        .catch(err => {
            return res.status(500).send(err);
        })
    }
});

/**
 * @api {post} /api/history Store new medical history
 * @apiGroup MedicalHistory
 * @apiDescription Create a new medical record for the selected patient.
 * @apiParam {String} Details Brief detail about the new medical record.
 * @apiParam {String} Notes Precise notes about the new medical record.
 * @apiParam {String} Date Date of creation.
 * @apiParam {String} patientId Id of the patient the medical record is being created.
 * @apiParamExample {json} MedicalHistory-Request-Example:
 * {
 *  "Details": "Test Details",
 *  "Notes": "Lorem Ipsum",
 *  "Date": "DD/MM/YYYY", 
 *  "patientId": "5d73ba97c3756200048cbe85"
 * }
 * @apiSuccess (200 Success) {String} MedicalHistoryCreated New medical data is created.
 * @apiSuccessExample {json}  MedicalHistoryCreated-Response-Example:
 *  HTTP/1.1 200 OK
 *  {
 *      newHistory: "newHistory",
 *      success: "true"
 *  }
 * @apiError (400 Error) {String} PatientNotFound No such patient exists in the database.
 * @apiErrorExample {json} PatientNotFound-Response-Example:
 *  HTTP/1.1 400 Bad Request
 *  {
 *      "No such patient exists in the database"
 *  }
 * @apiError (401 Error) {String} Unauthorized User is unauthorized. 
 * @apiErrorExample {json} Unauthorized-Response-Example:
 *  HTTP/1.1 401 Unauthorized
 *  {
 *      "Invalid Usertype, only a doctor can make this request"
 *  }
 * @apiError (500 Error) {String} ServerError Something went wrong serverside. 
 * @apiErrorExample {json} ServerError-Response-Example:
 *  HTTP/1.1 500 Internal Error
 *  {
 *      "Something went wrong serverside"  
 *  }  
 */ 
app.post('/api/history', passport.authenticate('jwt'), (req, res) => {
    if(req.user.userType != 'doctor') {
        return res.status(401).send('Unauthorized');
    }
    const {details, notes, date, patientid} = req.body;
    User.find({email: null})
    .then(user => {
        if(!user) return res.status(400).send('no such patient exists');
        const newHistory = new History({
            details: details,
            doctor: req.user.id,
            patient: patientid,
            notes: notes,
            date: date
        });
        newHistory.save(err => {
            return err
                ? res.status(500).send(err)
                : res.status(200).json({
                    newDevice: newHistory,
                    success: true
                });
        });
    })
    .catch(err => {
        return res.status(500).send(err);
    });
});

app.get('*', (req, res) => {
    res.status(404).send("404 NOT FOUND");
})

// api endpoints end

// Listening
app.listen(port, () => {
    console.log(`connected to mongoDBURL = ${process.env.MONGO_URL}`);
    console.log(`listening on port ${port}`);
});