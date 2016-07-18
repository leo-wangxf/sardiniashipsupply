var Hapi = require('hapi');
var server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

var routes = require('./routes');
var Mongoose = require('mongoose');


// MongoDB Connection
Mongoose.connect('mongodb://seidue.crs4.it:3996/trends');

routes.init(server);


//
//PLUGINS SETUP
//

// a plugin for handling fields in get urls (https://www.npmjs.com/package/hapi-fields)
server.register({register: require('hapi-fields')}, function (err) {
    if (err) throw err;
});

// a plugin for automatic documentation generation
server.register([require('vision'), require('inert'), {register: require('lout')}], function (err) {
    if (err) throw err;
});


// a plugin for pagination  (https://www.npmjs.com/package/hapi-paginate)
server.register({
    register: require('hapi-paginate'),
    options: {
        limit: 20,
        name: 'metadata',
        results: 'results',
        routes: ['/api/trends', '/api/trends/mostfound', '/api/trends/mostwanted', '/api/trends/rare', '/api/trends/notfound']
    }
});

// a plugin for serving static files (https://www.npmjs.com/package/inert)
server.register(require('inert'), function (err) {
    if (err) {
        throw err;
    }
    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: 'static',
                listing: true
            }
        },
        config: {
            plugins: {
                lout: false  // disable documentation for static file serving route
            }
        }

    });
});

//
//SERVER START
//

server.start(function () {
    console.log('Server started at: ' + server.info.uri);
});

