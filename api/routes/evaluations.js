var express = require('express');
var Evaluation = require('../models/evaluations').Evaluation;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');


router.get('/evaluations',
    au.doku({  // json documentation
        description: 'Get all the evaluations defined in db',
        fields: {
            page: {
                description: 'The current page for pagination',
                type: 'integer', required: false
            },
            limit: {
                description: 'The current limit for pagination',
                type: 'integer', required: false
            }
        }
    }),
    function (req, res) {

        var query = _.extend({}, req.query);
        if (query.hasOwnProperty('page')) delete query.page;
        if (query.hasOwnProperty('limit')) delete query.limit;

        Evaluation.paginate(query, {page: req.query.page, limit: req.query.limit}, function (err, entities) {
            if (err) return res.boom.badImplementation(err); // Error 500

            if (entities.total === 0)
                res.boom.notFound("No Evaluations found for query " + JSON.stringify(query)); // Error 404
            else
                res.send(entities); // HTTP 200 ok

        });

    });


router.post('/evaluations',
    au.doku({  // json documentation
        description: 'Create an evaluation in db',
        fields: {
            unspsc: {type: "String", required: true, description: "Standard code from unspsc"},
            name: {type: "String", required: true},
            description: {type: "String", required: false}
        }
    }),
    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData("Empty boby"); // Error 422

        Evaluation.create(req.body, function (err, entities) {

            if (err) {
                if (err.name === "ValidationError")
                    return res.boom.badData(err.message); // Error 422
                else
                    return res.boom.badImplementation(err);// Error 500
            }

            if (!entities)
                return res.boom.badImplementation("Someting strange"); // Error 500
            else
                return res.status(201).send(entities);  // HTTP 201 created
        });

    });


router.get('/evaluations/:id',
    au.doku({  // json documentation
        description: 'Get an evaluation by id',
        params: {
            id: {type: "String", required: true}
        }
    }), function (req, res) {
        var id = req.params['id'].toString();

        var newVals = req.body; // body already parsed

        Evaluation.findById(id, newVals, function (err, entities) {

            if (err) {
                if (err.name === "CastError")
                    return res.boom.badData("Id malformed"); // Error 422
                else
                    return res.boom.badImplementation(err);// Error 500
            }

            if (_.isEmpty(entities))
                return res.boom.notFound("No entry with id " + id); // Error 404
            else
                return res.send(entities);  // HTTP 200 ok
        });
    }
);


var putCallback = function (req, res) {

    if (_.isEmpty(req.body))
        return res.boom.badData("Empty boby"); // Error 422

    var id = req.params['id'].toString();

    var newVals = req.body; // body already parsed

    Evaluation.findByIdAndUpdate(id, newVals, function (err, entities) {

        if (err) {
            if (err.name === "ValidationError")
                return res.boom.badData(err.message); // Error 422
            else if (err.name === "CastError")
                return res.boom.badData("Id malformed"); // Error 422
            else
                return res.boom.badImplementation(err);// Error 500
        }

        if (_.isEmpty(entities))
            return res.boom.notFound("No entry with id " + id); // Error 404
        else
            return res.send(entities);  // HTTP 200 ok
    });

};


router.put('/evaluations/:id',
    au.doku({  // json documentation
        description: 'Update an evaluation by id',
        params: {
            id: {type: "String", required: true}
        },
        fields: {
            unspsc: {type: "String", required: true, description: "Standard code from unspsc"},
            name: {type: "String", required: true},
            description: {type: "String", required: false}
        }
    }), putCallback
);

router.patch('/evaluations/:id',
    au.doku({  // json documentation
        description: 'Update a evaluation by id',
        params: {
            id: {type: "String", required: true}
        },
        fields: {
            unspsc: {type: "String", required: true, description: "Standard code from unspsc"},
            name: {type: "String", required: true},
            description: {type: "String", required: false}
        }
    }), putCallback
);


router.delete('/evaluations/:id',
    au.doku({  // json documentation
        description: 'Delete an evaluation by id',
        params: {
            id: {type: "String", required: true}
        }
    }),
    function (req, res) {

        var id = req.params['id'].toString();

        Evaluation.findByIdAndRemove(id, function (err, entities) {

            if (err) {
                if (err.name === "CastError")
                    return res.boom.badData("Id malformed"); // Error 422
                else
                    return res.boom.badImplementation(err);// Error 500
            } else
                return res.status(204).send();  // HTTP 204 ok, no body
        });

    });


module.exports = router;
