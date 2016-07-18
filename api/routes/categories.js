var express = require('express');
var Category = require('../models/categories').Category;
//var util = require('util');
//var _ = require('underscore')._;
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

        Category.paginate(req.query, {page: req.query.page, limit: req.query.limit},function (err, entities) {
            if (err) return res.boom.badImplementation(err)

            res.send(entities);

        });

    });


module.exports = router;