var Boom = require('boom'); // HTTP Errors
var Joi = require('joi'); // Validation
var Trend = require('../models/trends').Trend; // Mongoose ODM

// Exports = exports? Huh? Read: http://stackoverflow.com/a/7142924/5210
module.exports = exports = function(server) {

    console.log('Loading trends routes');
    exports.index(server);
    exports.create(server);
    exports.show(server);
    exports.remove(server);
    exports.mostWanted(server);
    exports.notfound(server);
    exports.rare(server);
    exports.mostFound(server);
};

/**
 * GET /trends
 * Gets all the trends from MongoDb and returns them.
 *
 * @param server - The Hapi Server
 */
exports.index = function(server) {
    // GET /trends
    server.route({
        method: 'GET',
        path: '/api/trends',
        // config: {
        //     description: 'Say hello!',
        //     notes: 'The user parameter defaults to \'stranger\' if unspecified',
        //     tags: ['api', 'greeting']
        // },
        handler: function(request, reply) {
            var query = request.query;
            if ("dateFrom" in request.query || "dateTo" in request.query) {
                var from = request.query.dateFrom;
                var to = request.query.dateTo;

                query['createdAt'] = {};
                if (from) {
                    delete query['dateFrom'];
                    query['createdAt']['$gte'] = from;
                }
                if (to) {
                    delete query['dateTo'];
                    query['createdAt']['$lte'] = to;
                }

            }
            Trend.find(query, null, {skip: request.limit * (request.page-1), limit: request.limit},function(err, results) {
                if (!err) {
                    reply( results );
                } else {
                    reply(Boom.badImplementation(err)); // 500 error
                }
            });
        }
    });
};

exports.mostWanted = function(server) {
    // GET /trends
    server.route({
        method: 'GET',
        path: '/api/trends/mostwanted',
        // config: {
        //     description: 'Say hello!',
        //     notes: 'The user parameter defaults to \'stranger\' if unspecified',
        //     tags: ['api', 'greeting']
        // },
        handler: function(request, reply) {

            Trend.aggregate([{ "$group": {_id: "$keyword", count: { "$sum": 1}, results:{$min:"$results"},fromDate:{$min:"$createdAt"}, toDate:{$max:"$createdAt"} }},{ $sort : { count : -1} },  { $limit : request.limit }], function (err, result) {
                if (err) {
                    console.log(err);
                    return  reply(Boom.badImplementation(err)); // 500 error;
                }
                console.log(result);
                reply( result );
            });

        }
    });
};

exports.mostFound = function(server) {
    // GET /trends
    server.route({
        method: 'GET',
        path: '/api/trends/mostfound',
        // config: {
        //     description: 'Say hello!',
        //     notes: 'The user parameter defaults to \'stranger\' if unspecified',
        //     tags: ['api', 'greeting']
        // },
        handler: function(request, reply) {

            Trend.aggregate([{ "$group": {_id: "$keyword", count: { "$sum": 1}, results:{$min:"$results"},fromDate:{$min:"$createdAt"}, toDate:{$max:"$createdAt"}}},{ $sort : { results : -1} },{$skip : (request.page-1)*request.limit},  { $limit : request.limit }], function (err, results) {
                if (err) {
                    console.log(err);
                    return  reply(Boom.badImplementation(err)); // 500 error;
                }
                console.log(results);
                reply( results );
            });

        }
    });
};

exports.rare = function(server) {
    // GET /trends
    server.route({
        method: 'GET',
        path: '/api/trends/rare',
        // config: {
        //     description: 'Say hello!',
        //     notes: 'The user parameter defaults to \'stranger\' if unspecified',
        //     tags: ['api', 'greeting']
        // },
        handler: function(request, reply) {



            Trend.aggregate([{ "$group": {_id: "$keyword", count: { "$sum": 1}, results:{$min:"$results"}}}, { $sort : { count : 1, results:1} }, {$skip : (request.page-1)*request.limit}, { $limit : request.limit }], function (err, results) {
                if (err) {
                    console.log(err);
                    return  reply(Boom.badImplementation(err)); // 500 error;
                }
                console.log(results);
                reply( results );
            });

        }
    });
};

exports.notfound = function(server) {
    // GET /trends
    server.route({
        method: 'GET',
        path: '/api/trends/notfound',
        // config: {
        //     description: 'Say hello!',
        //     notes: 'The user parameter defaults to \'stranger\' if unspecified',
        //     tags: ['api', 'greeting']
        // },
        handler: function(request, reply) {

            Trend.aggregate([{ $match: { results : {$lt: 1} } },{ "$group": {_id: "$keyword", results :{$sum:"$results" }, count :{$sum:1}, fromDate:{$min:"$createdAt"}, toDate:{$max:"$createdAt"}} }, { $sort : { count : -1} }, { $limit:request.limit }, {$skip:(request.page-1)*request.limit}], function (err, results) {
                if (err) {
                    console.log(err);
                    return  reply(Boom.badImplementation(err)); // 500 error;
                }
                console.log(results);
                reply( results );
            });

        }
    });
};

/**
 * POST /trends
 * Creates a new trend in the datastore.
 *
 * @param server - The Hapi Serve
 */
exports.create = function(server) {
    // POST /trends
    var trend;

    server.route({
        method: 'POST',
        path: '/api/trends',
        handler: function(request, reply) {

            trend = new Trend();
            trend.dateCreated = request.payload.dateCreated;
            trend.idCustomer = request.payload.idCustomer;
            trend.category = request.payload.category;
            trend.keyword = request.payload.keyword;
            trend.results = request.payload.results;

            trend.save(function(err) {
                if (!err) {
                    reply(trend).created('/api/trends/' + trend._id); // HTTP 201
                } else {
                    reply(Boom.forbidden(getErrorMessageFrom(err))); // HTTP 403
                }
            });
        }
    });
};

/**
 * GET /trends/{id}
 * Gets the trend based upon the {id} parameter.
 *
 * @param server
 */
exports.show = function(server) {

    server.route({
        method: 'GET',
        path: '/api/trends/{id}',
        config: {
            validate: {
                params: {
                    id: Joi.string().alphanum().min(5).required()
                }
            }
        },
        handler: function(request, reply) {
            Trend.findById(request.params.id, function(err, trend) {
                if (!err && trend) {
                    reply(trend);
                } else if (err) {
                    // Log it, but don't show the user, don't want to expose ourselves (think security)
                    console.log(err);
                    reply(Boom.notFound());
                } else {

                    reply(Boom.notFound());
                }
            });
        }
    })
};

/**
 * DELETE /trends/{id}
 * Deletes a trend, based on the trend id in the path.
 *
 * @param server - The Hapi Server
 */
exports.remove = function(server) {
    server.route({
        method: 'DELETE',
        path: '/api/trends/{id}',
        config: {
            validate: {
                params: {
                    id: Joi.string().alphanum().min(5).required()
                }
            }
        },
        handler: function(request, reply) {
            Trend.findById(request.params.id, function(err, trend) {
                if (!err && trend) {
                    trend.remove();
                    reply({
                        message: "Trend deleted successfully"
                    });
                } else if (!err) {
                    // Couldn't find the object.
                    reply(Boom.notFound());
                } else {
                    console.log(err);
                    reply(Boom.badRequest("Could not delete Trend"));
                }
            });
        }
    })
};

/**
 * Formats an error message that is returned from Mongoose.
 *
 * @param err The error object
 * @returns {string} The error message string.
 */
function getErrorMessageFrom(err) {
    var errorMessage = '';

    if (err.errors) {
        for (var prop in err.errors) {
            if (err.errors.hasOwnProperty(prop)) {
                errorMessage += err.errors[prop].message + ' '
            }
        }

    } else {
        errorMessage = err.message;
    }

    return errorMessage;
}
