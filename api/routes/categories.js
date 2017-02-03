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

        Category.paginate(query, {page: req.query.page, limit: req.query.limit}).then(function (entities) {
            if (entities.total === 0)
                return res.boom.notFound('No Categories found for query ' + JSON.stringify(query)); // Error 404
            else
                return res.send(entities); // HTTP 200 ok
        }).catch(function (err) {
            if (err) return res.boom.badImplementation(err); // Error 500
            else return res.boom.badImplementation(); // Error 500
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

        Category.create(req.body).then(function (entities) {
            if (_.isEmpty(entities))
                return res.boom.badImplementation('Someting strange'); // Error 500
            else
                return res.status(201).send(entities);  // HTTP 201 created
        }).catch(function (err) {
            if (err.name === 'ValidationError')
                return res.boom.badData(err.message); // Error 422
            else
                return res.boom.badImplementation(err);// Error 500
        });

    });

var commentCatId =
{  // json documentation
    title: 'Get a category by id',
    version: '1.0.0',
    name: 'GetCategory',
    group: 'Categories',
    description: 'Get a category by id',
    params: {
        id: {type: 'String', required: true, description: 'The category identifier'}
    }

};


router.get('/categories/drop',
    au.doku({  // json documentation
        description: 'Get name categories for drop or autocomplete',
        title: 'Get categories',
        version: '1.0.0',
        name: 'Get drop category ',
        group: 'Categories',
        fields: {
            name: {
                description: 'Name of the category',
                type: 'string', required: false
            },
            liv: {
                description: 'Number of level',
                type: 'numeric', required: false
            },
            lang: {
                description: 'Lang',
                type: 'string', required: true
            }
        }
    }),
    function (req, res) {
        

        var param = {};
        var elem = {};
        var option = {};
        
        elem = JSON.parse('{"_id": 1, "name.'+ req.query.lang + '":"1"}');
        
        if (req.query.name)
        {
            var name = new RegExp(req.query.name, "i");
            var str = 'name.'+ req.query.lang;
            param[str] = name; 
        };

        if (req.query.liv)
        {
            var liv = parseInt(req.query.liv);
            var str = 'level.liv';
            param[str] = liv; 
        }
        
        
        var option = {
                limit: 100
                , sort: 'name.'+ req.query.lang
                };
        
        
            Category.find(param, elem, option).then(function (entities) {
            if (_.isEmpty(entities))
                res.boom.notFound('No entry '); // Error 404
            else
                res.send(entities);  // HTTP 200 ok
        }).catch(function (err) {
            console.log(err);
                
            if (err.name === 'CastError')
                res.boom.badData('Url malformed'); // Error 422
            else
                res.boom.badImplementation(err);// Error 500
        });
        
    }); 


router.get('/categories/:id',
    au.doku(commentCatId), function (req, res) {
        var id = req.params.id.toString();

        var newVals = req.body; // body already parsed

        Category.findById(id, newVals).then(function (entities) {
            if (_.isEmpty(entities))
                return res.boom.notFound('No entry with id ' + id); // Error 404
            else
                return res.send(entities);  // HTTP 200 ok
        }).catch(function (err) {
            if (err.name === 'CastError')
                return res.boom.badData('Id malformed'); // Error 422
            else
                return res.boom.badImplementation(err);// Error 500
        });
    }
);


var putCallback = function (req, res) {

    if (_.isEmpty(req.body))
        return res.boom.badData('Empty boby'); // Error 422

    var id = req.params.id.toString();

    var newVals = req.body; // body already parsed

    Category.findByIdAndUpdate(id, newVals).then(function (entities) {
        if (_.isEmpty(entities))
            return res.boom.notFound('No entry with id ' + id); // Error 404
        else
            return res.send(entities);  // HTTP 200 ok
    }).catch(function (err) {
        if (err.name === 'ValidationError')
            return res.boom.badData(err.message); // Error 422
        else if (err.name === 'CastError')
            return res.boom.badData('Id malformed'); // Error 422
        else
            return res.boom.badImplementation(err);// Error 500
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

        var id = req.params.id.toString();

        Category.findByIdAndRemove(id).then(function (entities) {
            return res.status(204).send();  // HTTP 204 ok, no body
        }).catch(function (err) {
            if (err.name === 'CastError')
                return res.boom.badData('Id malformed'); // Error 422
            else
                return res.boom.badImplementation(err);// Error 500
        });

    });


   
    
    
module.exports = router;