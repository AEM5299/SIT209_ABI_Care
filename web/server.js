const express = require('express');
const app = express();

const port = 3000;
const base = `${__dirname}/public`;

app.use(express.static('public'));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-RequestedWith, Content-Type, Accept");
    next();
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});

app.get('/login', (req, res) => {
    res.sendFile(`${base}/login.html`);
});

app.get('/register', (req, res) => {
    res.sendFile(`${base}/register.html`);
});

app.get('/history', (req, res) => {
    res.sendFile(`${base}/history.html`);
});

app.get('*', (req, res) => {
    res.sendFile(`${base}/404.html`);
});

