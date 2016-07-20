var express = require('express');
var Category = require('../models/categories').Category;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');


router.get('/categories',
    au.doku({  // json documentation
        description: 'Get all the categories defined in db',
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

        Category.paginate(query, {page: req.query.page, limit: req.query.limit}, function (err, entities) {
            if (err) return res.boom.badImplementation(err); // Error 500

            if (entities.total === 0)
                res.boom.notFound("No Categories found for query " + JSON.stringify(query)); // Error 404
            else
                res.send(entities);

        });

    });


router.post('/categories',
    au.doku({  // json documentation
        description: 'Create a categories in db',
        fields: {
            unspsc: {type: "String", required: true, description: "Standard code from unspsc"},
            name: {type: "String", required: true},
            description: {type: "String", required: false}
        }
    }),
    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData("Empty boby"); // Error 422

        Category.create(req.body, function (err, entities) {

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


var putCallback = function (req, res) {

    if (_.isEmpty(req.body))
        return res.boom.badData("Empty boby"); // Error 422

    var id = req.params['id'].toString();

    var newVals = req.body; // body already parsed

    Category.findOneAndUpdate({_id: id}, newVals, function (err, entities) {

        if (err) {
            if (err.name === "ValidationError")
                return res.boom.badData(err.message); // Error 422
            else
                return res.boom.badImplementation(err);// Error 500
        }

        if (!entities)
            return res.boom.badImplementation("Someting strange"); // Error 500
        else
            return res.send(entities);  // HTTP 201 created
    });

};

router.put('/categories/:id',
    au.doku({  // json documentation
        description: 'Update a category in db',
        fields: {
            unspsc: {type: "String", required: true, description: "Standard code from unspsc"},
            name: {type: "String", required: true},
            description: {type: "String", required: false}
        }
    }),putCallback
    );

router.patch('/categories/:id',
    au.doku({  // json documentation
        description: 'Update a category in db',
        fields: {
            unspsc: {type: "String", required: true, description: "Standard code from unspsc"},
            name: {type: "String", required: true},
            description: {type: "String", required: false}
        }
    }),putCallback
);

module.exports = router;