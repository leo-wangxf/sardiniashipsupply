var Boom = require('boom'); // HTTP Errors
var Joi = require('joi'); // Validation
var Trend = require('../models/trends').Trend; // Mongoose ODM
var _ = require('underscore')._;

// Exports = exports? Huh? Read: http://stackoverflow.com/a/7142924/5210
module.exports = exports = function (server) {

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

//
//TRENDS CRUD
//


/**
 * GET /trends
 * Gets all the trends from MongoDb and returns them.
 *
 * @param server - The Hapi Server
 */
exports.index = function (server) {
    // GET /api/trends
    server.route({
        method: 'GET',
        path: '/api/trends',
        config: {
            description: 'Get trends records from db',
            notes: 'Endpoint for getting trends from db, by querying between date interval (dateFrom and dateTo) and/or selecting specific fields.',
            tags: ['api', 'CRUD', 'get', 'trends']
        },
        handler: function (request, reply) {
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
            Trend.find(query, null, {
                skip: request.limit * (request.page - 1),
                limit: request.limit
            }).then(function (results) {
                if (_.isEmpty(results))
                    reply(Boom.notFound("Not found elements for query " + JSON.stringify(query)));
                else
                    reply(results);  // HTTP 200 ok
            }).catch(function (err) {
                reply(Boom.badImplementation(err)); // 500 error
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
exports.create = function (server) {
    // POST /api/trends
    var trend;

    server.route({
        method: 'POST',
        path: '/api/trends',
        config: {
            description: 'Create a trend record',
            notes: 'Endpoint that creates a trend record.',
            tags: ['api', 'CRUD', 'post', 'create', 'trends']
        },
        handler: function (request, reply) {

            trend = new Trend();
            trend.dateCreated = request.payload.dateCreated;
            trend.idCustomer = request.payload.idCustomer;
            trend.category = request.payload.category;
            trend.keyword = request.payload.keyword;
            trend.results = request.payload.results;

            trend.save().then(function () {
                reply(trend).created('/api/trends/' + trend._id); // HTTP 201 created
            }).catch(function (err) {
                reply(Boom.forbidden(getErrorMessageFrom(err))); // HTTP 403
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
exports.show = function (server) {

    server.route({
        method: 'GET',
        path: '/api/trends/{id}',
        config: {
            validate: {
                params: {
                    id: Joi.string().alphanum().min(5).required()
                }
            },
            description: 'Get a trend record by id',
            notes: 'Endpoint that get a trend record identified by id.',
            tags: ['api', 'CRUD', 'get', 'byId', 'trends']

        },

        handler: function (request, reply) {
            Trend.findById(request.params.id).then(function (trend) {
                if (_.isNull(trend))
                    reply(Boom.notFound());  // Error 404
                reply(trend);  // HTTP 200 ok
            }).catch(function (err) {
                reply(Boom.notFound());  // Error 404
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
exports.remove = function (server) {
    server.route({
        method: 'DELETE',
        path: '/api/trends/{id}',
        config: {
            validate: {
                params: {
                    id: Joi.string().alphanum().min(5).required()
                }
            },
            description: 'Delete a trend record by id',
            notes: 'Endpoint that delete a trend record identified by id.',
            tags: ['api', 'CRUD', 'delete', 'byId', 'trends']
        },
        handler: function (request, reply) {
            Trend.findByIdAndRemove(request.params.id).then(function (trend) {
                reply({
                    message: "Trend deleted successfully"
                });  // HTTP 200 ok
            }).catch(function (err) {
                reply(Boom.notFound());   // Error 404
            });
        }
    })
};


//
//TRENDS STATISTICS
//


exports.mostWanted = function (server) {
    // GET /api/trends/mostwanted
    server.route({
        method: 'GET',
        path: '/api/trends/mostwanted',
        config: {
            description: 'Get a list of the most frequent search keywords',
            notes: 'Endpoint for getting the "most wanted" "products", in fact the most searched keywords',
            tags: ['api', 'keywords', 'trends', 'statistics']
        },
        handler: function (request, reply) {

            Trend.aggregate([{
                "$group": {
                    _id: "$keyword",
                    count: {"$sum": 1},
                    results: {$min: "$results"},
                    fromDate: {$min: "$createdAt"},
                    toDate: {$max: "$createdAt"}
                }
            }, {$sort: {count: -1}}, {$limit: request.limit}]).then(function (result) {
                reply(result);      // HTTP 200 ok
            }).catch(function (err) {
                reply(Boom.badImplementation(err)); // 500 error;
            });
        }
    });
};

exports.mostFound = function (server) {
    // GET /api/trends/mostfound
    server.route({
        method: 'GET',
        path: '/api/trends/mostfound',
        config: {
            description: 'Most found searches by keyword',
            notes: 'Endpoint to get the searches giving more results; it allows to know what kind of searches are better satisfied, which keywords/phrase have more supplier/products then others.',
            tags: ['api', 'results', 'found', 'trends', 'statistics']
        },
        handler: function (request, reply) {

            Trend.aggregate([{
                "$group": {
                    _id: "$keyword",
                    count: {"$sum": 1},
                    results: {$min: "$results"},
                    fromDate: {$min: "$createdAt"},
                    toDate: {$max: "$createdAt"}
                }
            }, {$sort: {results: -1}}, {$skip: (request.page - 1) * request.limit}, {$limit: request.limit}]).then(function (result) {
                reply(results);      // HTTP 200 ok
            }).catch(function (err, results) {
                reply(Boom.badImplementation(err)); // 500 error;

            });

        }
    });
};

exports.rare = function (server) {
    // GET /api/trends/rare
    server.route({
        method: 'GET',
        path: '/api/trends/rare',
        config: {
            description: 'Most rare products/suppliers',
            notes: 'Endpoint that collect the searches with minor number of results, but not zero; allows to know which are the keywords/phrases giving at least one result, ordered asc.',
            tags: ['api', 'rare', 'trends', 'statistics']
        },
        handler: function (request, reply) {


            Trend.aggregate([{
                "$group": {
                    _id: "$keyword",
                    count: {"$sum": 1},
                    results: {$min: "$results"}
                }
            }, {
                $sort: {
                    count: 1,
                    results: 1
                }
            }, {$skip: (request.page - 1) * request.limit}, {$limit: request.limit}]).then(function (results) {
                reply(results);   // HTTP 200 ok
            }).catch(function (err) {
                return reply(Boom.badImplementation(err)); // 500 error;
            });

        }
    });
};

exports.notfound = function (server) {
    // GET /api/trends/notfound
    server.route({
        method: 'GET',
        path: '/api/trends/notfound',
        config: {
            description: 'Not found keywords/products/suppliers',
            notes: 'Endpoint that collects the searches with zero results.',
            tags: ['api', 'notfound', 'trends', 'statistics']
        },
        handler: function (request, reply) {

            Trend.aggregate([{$match: {results: {$lt: 1}}}, {
                "$group": {
                    _id: "$keyword",
                    results: {$sum: "$results"},
                    count: {$sum: 1},
                    fromDate: {$min: "$createdAt"},
                    toDate: {$max: "$createdAt"}
                }
            }, {$sort: {count: -1}}, {$limit: request.limit}, {$skip: (request.page - 1) * request.limit}]).then(function (results) {
                reply(results);  // HTTP 200 ok
            }).catch(function (err) {
                return reply(Boom.badImplementation(err)); // 500 error;
            });

        }
    });
};


//
//UTILS
//


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
