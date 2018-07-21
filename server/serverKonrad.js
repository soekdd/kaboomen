const express = require('express');

const app = express.Router();

app.get('/', (req, res) => {
    app.res('Hello World!');
});

module.exports = app;