'use strict'
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');


var index = require('./routes/index');
var loadevaluations = require('./routes/loadevaluations');
var synch_evaluations = require('./routes/allevaluations');

//QMiner
var qm = require('qminer');
var loader = require('qminer-data-loader');

var app = express();
var config = require('propertiesmanager').conf;

//let prefix = '/api/v1';




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



// error messages formatter
var boom = require('express-boom');
app.use(boom());

//routes
app.use('/', routes);

// To be REMOVED
if (app.get('env') === 'dev' || app.get('env') === 'test' ) {
  app.set('nocheck', true);
  console.log("INFO: Development/test mode, skipping token checks"); 
}


if (app.get('env') === 'dev' || app.get('env') === 'test' ) {
  app.set('nocheck', true);
  console.log("INFO: Development/test mode, skipping token checks"); 
}


app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/loadevaluations', loadevaluations);
app.use('/allevaluations', loadevaluations);

// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});*/

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
