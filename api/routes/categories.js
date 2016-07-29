var express = require('express');
var Category = require('../models/categories').Category;
//var util = require('util');
var _ = require('underscore')._;
var router = express();
var au = require('audoku');


router.get('/categories',
    au.doku({  // json documentation
        description: 'Get all the categories defined in db',
        title: 'Get categories',
        version: '1.0.0',
        name: 'GetCategories',
        group: 'Categories',
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
                res.boom.notFound('No Categories found for query ' + JSON.stringify(query)); // Error 404
            else
                res.send(entities); // HTTP 200 ok
        });

    });


router.post('/categories',
    au.doku({  // json documentation
        description: 'Create a category in db',
        title: 'Create a category',
        version: '1.0.0',
        name: 'PostCategory',
        group: 'Categories',
        bodyFields: {
            unspsc: {type: 'String', required: true, description: 'Standard code from unspsc'},
            name: {type: 'String', required: true, description: 'Category name'},
            description: {type: 'String', required: false, description: 'A category textual description'}
        }
        /*,
        bodyFieldsExamples: [
            {
                "title": "Request-Example:",
                "content": "    HTTP/1.1 POST request\nBody:\n   {\n        \"username\" : \"user@name.go\",\n        \"password\" : \"drowssap\"",
                "type": "json"
            }
        ]*/
    }),
    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData('Empty boby'); // Error 422

        Category.create(req.body, function (err, entities) {

            if (err) {
                if (err.name === 'ValidationError')
                    return res.boom.badData(err.message); // Error 422
                else
                    return res.boom.badImplementation(err);// Error 500
            }

            if (!entities)
                return res.boom.badImplementation('Someting strange'); // Error 500
            else
                return res.status(201).send(entities);  // HTTP 201 created
        });

    });


router.get('/categories/:id',
    au.doku({  // json documentation
        title: 'Get a category by id',
        version: '1.0.0',
        name: 'GetCategory',
        group: 'Categories',
        description: 'Get a category by id',
        params: {
            id: {type: 'String', required: true, description: 'The category identifier'}
        }

    }), function (req, res) {
        var id = req.params['id'].toString();

        var newVals = req.body; // body already parsed

        Category.findById(id, newVals, function (err, entities) {

            if (err) {
                if (err.name === 'CastError')
                    return res.boom.badData('Id malformed'); // Error 422
                else
                    return res.boom.badImplementation(err);// Error 500
            }

            if (_.isEmpty(entities))
                return res.boom.notFound('No entry with id ' + id); // Error 404
            else
                return res.send(entities);  // HTTP 200 ok
        });
    }
);


var putCallback = function (req, res) {

    if (_.isEmpty(req.body))
        return res.boom.badData('Empty boby'); // Error 422

    var id = req.params['id'].toString();

    var newVals = req.body; // body already parsed

    Category.findByIdAndUpdate(id, newVals, function (err, entities) {

        if (err) {
            if (err.name === 'ValidationError')
                return res.boom.badData(err.message); // Error 422
            else if (err.name === 'CastError')
                return res.boom.badData('Id malformed'); // Error 422
            else
                return res.boom.badImplementation(err);// Error 500
        }
        if (_.isEmpty(entities))
            return res.boom.notFound('No entry with id ' + id); // Error 404
        else
            return res.send(entities);  // HTTP 200 ok
    });

};


router.put('/categories/:id',
    au.doku({  // json documentation
        title: 'Update a category by id',
        version: '1.0.0',
        name: 'UpdateCategory',
        group: 'Categories',
        description: 'Update a category by id',
        params: {
            id: {type: 'String', required: true, description: 'The category identifier'}
        },
        bodyFields: {
            unspsc: {type: 'String', required: true, description: 'Standard code from unspsc'},
            name: {type: 'String', required: true, description: 'The category name'},
            description: {type: 'String', required: false, description: 'A category description'}
        }
    }), putCallback
);

router.patch('/categories/:id',
    au.doku({
        // json documentation
        title: 'Update a category by id (patch)',
        version: '1.0.0',
        name: 'UpdateCategory (patch)',
        group: 'Categories',
        description: 'Update a category by id',
        params: {
            id: {type: 'String', required: true}
        },
        bodyFields: {
            unspsc: {type: 'String', required: true, description: 'Standard code from unspsc'},
            name: {type: 'String', required: true},
            description: {type: 'String', required: false}
        }
    }), putCallback
);


router.delete('/categories/:id',
    au.doku({
        // json documentation
        title: 'Delete a category by id ',
        version: '1.0.0',
        name: 'DeleteCategory',
        group: 'Categories',
        description: 'Delete a category by id',
        params: {
            id: {type: 'String', required: true, description: 'The category identifier'}
        }
    }),

    function (req, res) {

        var id = req.params['id'].toString();

        Category.findByIdAndRemove(id, function (err, entities) {

            if (err) {
                if (err.name === 'CastError')
                    return res.boom.badData('Id malformed'); // Error 422
                else
                    return res.boom.badImplementation(err);// Error 500
            } else
                return res.status(204).send();  // HTTP 204 ok, no body
        });

    });


module.exports = router;