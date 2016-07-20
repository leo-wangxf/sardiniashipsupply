var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
//var users = require('./routes/users');

var categories = require('./routes/categories');

var app = express();

var configs = {

    dev:{
        dbHost: "localhost",
        dbPort: "27017",
        dbName: "apiDEV"
    },
    production:{

        dbHost: "seidue.crs4.it",
        dbPort: "3996",
        dbName: "api"
    }

};

if (process.env['NODE_ENV'] === 'dev') {
    app.set("conf",configs.dev );
    app.set("env",'development');
}
else{
    app.set("conf",configs.production );
}



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//pagination
var paginate = require('express-paginate');
app.use(paginate.middleware(10, 50));

// error messages formatter
var boom = require('express-boom');
app.use(boom());

//routes
app.use('/', routes);
//app.use('/users', users);
app.use('/api', categories);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;