const express = require('express');
const app = express();

const port = process.env.PORT || 3000;
const base = `${__dirname}/public`;

app.use(express.static(base));

app.get('/', (req, res) => {
    res.redirect('/home')
});

app.get('/login', (req, res) => {
    res.sendFile(`${base}/login.html`);
});

app.get('/registermember', (req, res) => {
    res.sendFile(`${base}/register_member.html`);
});

app.get('/registerdoctor', (req, res) => {
    res.sendFile(`${base}/register_doctor.html`);
});

app.get('/register', (req, res) => {
    res.sendFile(`${base}/register.html`);
});

app.get('/devices', (req, res) => {
    res.sendFile(`${base}/devices.html`);
});

app.get('/history', (req, res) => {
    res.sendFile(`${base}/history.html`);
});

app.get('/devices', (req, res) => {
    res.sendFile(`${base}/devices.html`);
});

app.get('/deviceadd', (req, res) => {
    res.sendFile(`${base}/device_add.html`);
});

app.get('/doctors', (req, res) => {
    res.sendFile(`${base}/doctors.html`);
});

app.get('/medical', (req, res) => {
    res.sendFile(`${base}/medical.html`);
});

app.get('/home', (req, res) => {
    res.sendFile(`${base}/homepage.html`);
});

app.get('*', (req, res) => {
    res.sendFile(`${base}/404.html`);
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
