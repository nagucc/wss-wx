/*
微信企业号标签管理
*/

var express = require('express'),
    router = express.Router();


module.exports = function (app, cfg, db) {
    app.use(express.query());
    app.use('/', router);
};

router.use('/hello', function (req, res, next) {
    res.send('hello, YAE!');
});