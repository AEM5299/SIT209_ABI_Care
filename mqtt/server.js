const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const random = require('random');
const nodemailer = require('nodemailer');
const Device = require('./models/device');
const User = require('./models/user');

const { MQTT_URL, MQTT_USER, MQTT_PASSWORD } = process.env;
const port = process.env.PORT || 5050;
const app = express();
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-RequestedWith, Content-Type, Accept");
	next();
});

function returnJSON(success, message, data) {
	return {
		success: success,
		message: message,
		data: data
	};
}

let testAccount = null;
let transporter = null;

async function setupEmail() {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
	});
	console.log('Done');
}

async function sendWarningEmail(email, title, body) {
	let info = await transporter.sendMail({
		from: '"ABI Care" <ABICare@example.com>', // sender address
		to: email, // list of receivers
		subject: title, // Subject line
		text: body, // plain text body
		html: body // html body
	});
	console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

}

const client = mqtt.connect(MQTT_URL, {
	username: MQTT_USER,
	password: MQTT_PASSWORD
});

client.on('connect', () => {
	console.log('MQTT Connected');
	client.subscribe('/DevicesDate');
});

client.on('message', (topic, message) => {
	if(topic == '/DevicesDate') {
		const data = JSON.parse(message.toString());
		console.log(data);

		Device.findById(data.deviceId, (err, device) => {
			if(err) console.log(err);
			if(!device) return;
			const date = new Date();
			if(data.type == 'BPM') {
				console.log('1');
				const {high, low} = data;
				if(high >= 180 || low >= 120) {
					const user = User.findById(device.owner, (err, user) => {
						const email = user.email;
						sendWarningEmail(email, 'Your blood pressure was too high' ,`Your Blood Pressure reading at ${date.toString()} was too high (${high}/${low}). Please consult a doctor.`)
					});
				}
				const array = [date.getTime(), high, low];
				device.data.push(array);
			}
			if(data.type == 'HRM') {
				console.log('2');
				const {rate} = data;
				const array = [date.getTime(), rate];
				device.data.push(array);
			}
			if(data.type == 'SLM') {
				console.log('3');
				const {level} = data;
				if(level >= 200) {
					const user = User.findById(device.owner, (err, user) => {
						const email = user.email;
						sendWarningEmail(email, 'Your glucose level was too high' ,`Your Sugar level reading at ${date.toString()} was too high (${level}). Please consult a doctor.`)
					});
				}
				const array = [date.getTime(), level];
				device.data.push(array);
			}
			device.save(err => {
				if(err) console.log(err);
				console.log('saved');
			});
		});

	}
});

app.put('/random_device_data', (req, res) => {
	const {deviceId, type} = req.body;
	const rand = random.int(10, 180);
	const topic = '/DevicesDate';
	let message = '';
	if(type == 'BPM')
		message = JSON.stringify({deviceId, type, high: rand * 2, low: rand});
	if(type == 'HRM')
		message = JSON.stringify({deviceId, type, rate: rand});
	if(type == 'SLM')
		message = JSON.stringify({deviceId, type, level: rand});

	client.publish(topic, message, () => {
		return res.json(returnJSON(true, "Fake data sent", {deviceId, message}));
	});
});

setupEmail();
app.listen(port, () => {
	console.log(`MQTT server listening on port ${port}`);
});