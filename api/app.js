var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var bearerToken = require('express-bearer-token');

var routes = require('./routes/index');
var users = require('./routes/users');
var sys = require('./routes/sys');

var categories = require('./routes/categories');
var products = require('./routes/products');
var conversations = require('./routes/conversations');
var messages = require('./routes/messages');
var requests = require('./routes/requests');
var evaluations = require('./routes/evaluations');
var admin = require('./routes/admin');
var files = require('./routes/files');
var config = require('propertiesmanager').conf;

//var test = require('./routes/test');
//var cors = require('cors');
var app = express();

var configs = {
    dev: {
        dbHost: "localhost",
        dbPort: "27017",
        dbName: "apiDEV"


    },
    /*
    production: {
        dbHost: "seidue.crs4.it",
        dbPort: "3996",
        dbName: "port_broker"
    }
    */

    production: {
        dbHost: config.dbHost,
        dbPort: config.dbPort,
        dbName: config.dbName
    }
};

app.set('port', process.env.PORT || '3000');

if (process.env.hasOwnProperty('NODE_ENV') && process.env.NODE_ENV === 'dev') {
    app.set("conf", configs.dev);
    app.set("env", 'development');
}
else {
    app.set("env", 'production');
    app.set("conf", configs.production);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//var resourceMonitorMiddleware = require('express-watcher').resourceMonitorMiddleware
// example without callback function
//app.use(resourceMonitorMiddleware)



app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '50mb'}));
app.use(cookieParser());
app.use(bearerToken());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(cors());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', config.AccessControlAllowOrigin);
  //res.header('Access-Control-Allow-Credentials' 'false');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, Accept, Content-Type, Authorization, Content-Length, X-Requested-With');
  if ('OPTIONS' == req.method) res.sendStatus(200);
    else next();
});

//pagination
var paginate = require('express-paginate');
app.use(paginate.middleware(10, 50));

// error messages formatter
var boom = require('express-boom');
app.use(boom());

//routes
app.use('/', routes);

var tokenMiddleware = require('./util/middlewares').tokenMiddleware;

var prefix = '/api/v1';
app.set("apiprefix", prefix);
app.use(prefix, sys);
app.use(prefix, users);
app.use(prefix, files);

app.use(prefix,  categories);
app.use(prefix, products);
app.use(prefix, evaluations);
app.use(prefix, admin);


if (app.get("env") !== 'development') {

    var audoku = require('audoku');


    audoku.apidocs({
        metadata: {
            "name": "Api Seidue",
            "version": "1.0.0",
            "title": "Seidue API",
            "url": "http://seidue.crs4.it",
            "header": {
                "title": "API Overview",
                "content": "<p>A wonderful set of APIs</p>"
            },
            "footer": {
                "title": "Maintained by CRS4",
                "content": "<p>Codebase maintained by CRS4</p>\n"
            }
        },
        app: app,
        docspath: '/docs',
        routers: [
            {
                basepath: "http://localhost:" + app.get('port') + prefix,
                router: categories
            }, {
                basepath: "http://localhost:" + app.get('port') + prefix,
                router: conversations
            }, {
                basepath: "http://localhost:" + app.get('port') + prefix,
                router: products
            },
            {
                basepath: "http://localhost:" + app.get('port') + prefix,
                router: evaluations
            },
            {
                basepath: "http://localhost:" + app.get('port') + prefix,
                router: files
            },
            {
                basepath: "http://localhost:" + app.get('port') + prefix,
                router: messages
            },
            {
                basepath: "http://localhost:" + app.get('port') + prefix,
                router: requests
            },
            {
                basepath: "http://localhost:" + app.get('port') + prefix,
                router: users
            }
        ]

    });
}

app.use(prefix, tokenMiddleware, messages);
app.use(prefix, tokenMiddleware, requests);
app.use(prefix, tokenMiddleware, conversations);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.boom.notFound(err.message);
        //res.status(err.status || 500);
        //res.render('error', {
        //  message: err.message,
        //  error: err
        //});
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
