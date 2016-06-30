var Hapi = require('hapi');
var server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

var routes = require('./routes');
var Mongoose = require('mongoose');


// MongoDB Connection
Mongoose.connect('mongodb://localhost/trends');

var rootHandler = function (request, reply) {
    reply({message: "Hello from Trends!"});
};

// Set root route
server.route({
    method: 'GET',
    path: '/',
    handler: rootHandler,
    config: {
        plugins: {
            lout: false
        }
    }

});

routes.init(server);


server.register({register: require('hapi-fields')}, function (err) {
    if (err) throw err;
});

server.register([require('vision'), require('inert'), {register: require('lout')}], function (err) {
});

/*
 const options = {
 query: {
 page: {
 name: 'page' // The page parameter will now be called the_page
 },
 limit: {
 name: 'limit', // The limit will now be called per_page
 default: 10       // The default value will be 10
 }
 },
 meta: {
 name: 'metadata', // The meta object will be called metadata
 count: {
 active: true,
 name: 'count'
 },
 pageCount: {
 name: 'totalPages'
 },
 self: {
 active: true // Will not generate the self link
 },
 first: {
 active: true // Will not generate the first link
 },
 last: {
 active: true // Will not generate the last link
 }
 },
 routes: {
 include: ['/trends'],
 }
 };

 server.register(
 {register:
 require('hapi-pagination')
 , options: options
 }
 , function(err) {
 if (err)
 throw err;
 });
 */

server.register({
    register: require('hapi-paginate'),
    options: {
        limit: 100,
        name: 'metadata',
        results: 'results',
        routes: ['/trends']
    }
});


server.start(function () {
    console.log('Server started at: ' + server.info.uri);
});
