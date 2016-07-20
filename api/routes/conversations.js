var express = require('express');
var Conversation = require('../models/conversations').Conversation;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');


router.get('/conversations',
    au.doku({  // json documentation
        description: 'Get all the conversations defined in db',
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
        
        Conversation.paginate({}, {page: req.query.page, limit: req.query.limit},function (err,entities) {
            if (err) return res.boom.badImplementation(err); // Error 500

            if (entities.total === 0)
                res.boom.notFound("No Conversations found for query " + JSON.stringify(req.query)); // Error 404
            else
                res.send(entities);

        });

    });


module.exports = router;