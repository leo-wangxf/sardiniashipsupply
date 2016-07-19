var mongoose = require('mongoose');
var app = require('../app');
var debug = require('debug')('models:db');


var conf = app.get("conf");

var dbUrl = conf.dbHost + ':' + conf.dbPort + '/' + conf.dbName;

var options = {
    server: {socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}}
    /*
     ,
     user: 'admin',
     pass: 'node'
     */
};

exports.connect = function connect(callback) {
    mongoose.Promise = global.Promise;
    mongoose.connect(dbUrl, options, function (err, res) {

        if (err) {
            debug('Unable to connect to database ' + dbUrl)
            callback(err);
        } else {
            var msg = 'Connected to database ' + dbUrl;
            //console.log(msg);
            debug(msg);
            callback();

        }
    });
};


exports.disconnect = function disconnect(callback) {

    mongoose.disconnect(callback);
};
