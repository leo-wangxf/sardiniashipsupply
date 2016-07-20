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


module.exports = router;