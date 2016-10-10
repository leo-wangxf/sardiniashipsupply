var express = require('express');
var Conversation = require('../models/conversations').Conversation;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');
var ObjectId = require('mongoose').Types.ObjectId;
var app = require("./../app");

router.get('/conversations',
    au.doku({  // json documentation
        description: 'Get all the conversations defined in db',
        title: 'Get conversations',
        version: '1.0.0',
        name: 'GetConversations',
        group: 'Conversations',
        fields: {
            page: {
                description: 'The current page for pagination',
                type: 'integer', required: false
            },
            limit: {
                description: 'The current limit for pagination',
                type: 'integer', required: false
            }
        },
        bodyFields: {
            completed:{
                description: 'The conversation status',
                type: 'string', required: false
            },
            date_in:{
                description: 'The conversation start date  ',
                type: 'string', required: false
            },
            by_uid:{
                description: 'The conversation user',
                type: 'string', required: false
            }
        }
    }),
    function (req, res) {
          console.log("GET Conversation");

        //console.dir( req.app.locals.settings.socketio.emit("data",{"d":"a"}));

        var query = _.extend({}, req.query);
        if (query.hasOwnProperty('page')) delete query.page;
        if (query.hasOwnProperty('limit')) delete query.limit;

         var allowedFields = ["completed", "date_in","by_uid"];
        for (var v in req.query)
            if (_.contains(allowedFields, v)) {
                if (v === "date_in") {
                    var timeQuery = {};
                    timeQuery["$gte"] = new Date(req.query[v]);
                    timeQuery["$lt"] = new Date(req.query[v]);
                    timeQuery["$lt"].setDate(timeQuery["$lt"].getDate() +1);
                    delete query[v];
                    query['dateIn'] = timeQuery ;
                    continue;
                }
                else if (v === "by_uid") {
                    var s = {'supplier': new ObjectId(query[v])};
                    var c = {'customer': new ObjectId(query[v])};
                    query['$or'] = [s,c];
                    delete query[v];
                    continue;
                }
                query[v] = req.query[v];

            }

        Conversation.paginate(query, {page: req.query.page, limit: req.query.limit, new: true, populate:'requests messages supplier customer'})
            .then(function (entities) {
                if (entities.total === 0)
                    return Promise.reject({
                        name:'ItemNotFound',
                        message: 'no conversation found',
                        errorCode: 404
                    });
                else{
                    res.send(entities); // HTTP 200 ok
                  //  console.log(entities);
                }

            }).catch(function (err) {
            console.log(err);
            if(err.name==="ItemNotFound") res.boom.notFound(err.message); // Error 404
            else if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else
            res.boom.badImplementation(err.message); // Error 500
        });


    });


router.post('/conversations',
    au.doku({  // json documentation

        description: 'Create a conversation in db',
        title: 'Create a conversation',
        version: '1.0.0',
        name: 'PostConversation',
        group: 'Conversations',
        bodyFields: {
            supplier: {type: 'String', required: true, description: 'Supplier user'},
            customer: {type: 'String', required: true, description: 'Customer user'},
            dateIn: {type: 'Date', required: true, description: 'Start conversation date '},
            dateValidity: {type: 'Date', required: true, description: 'Validity for requests'},
            dateEnd: {type: 'Date', description: 'End conversation date '},
            subject: {type: 'String', description: 'Conversation subject '},
            completed: {type: 'Boolean', required: true, description: 'Conversation completion ', default:false},
            messages: {type: 'Array', description: 'List conversation messages '},
            requests: {type: 'Array', description: 'List conversation requests '},
            hidden: {type: 'Boolean', description: 'Conversation visibility ', default:false}
        }
    }),
    function (req, res) {

        if (_.isEmpty(req.body))
            return res.boom.badData('Empty body'); // Error 422
        // instanceof Date
        Conversation.create(req.body).then(function (entities) {

            if (!entities)
                res.boom.badImplementation('Someting strange'); // Error 500
            else
                res.status(201).send(entities);  // HTTP 201 created
        }).catch(function (err) {
            if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else
                res.boom.badImplementation(err);// Error 500
        });

    });


router.get('/conversations/:id',
    au.doku({  // json documentation
        title: 'Get a conversation by id',
        version: '1.0.0',
        name: 'GetConversation',
        group: 'Conversations',
        description: 'Get a conversation by id',
        params: {
            id: {type: 'String', required: true, description: 'The conversation identifier'}
        }

    }), function (req, res) {
        var id = req.params.id.toString();

        var newVals = req.body; // body already parsed

        Conversation.findById(id, newVals).populate({path:'requests messages supplier customer', populate: [{ path: 'product',model:'Product',populate:[{path:'categories',model:'Category'}]},
            { path: 'sender',model:'User'} ]
        }).then(function (entities) {
           // console.dir(entities._doc.messages);
            if (_.isEmpty(entities))
                res.boom.notFound('No entry with id ' + id); // Error 404
            else
                res.send(entities);  // HTTP 200 ok
        }).catch(function (err) {
            if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation(err);// Error 500
        });
    }
);


router.delete('/conversations/:id',
    au.doku({
        // json documentation
        title: 'Delete a conversation by id ',
        version: '1.0.0',
        name: 'DeleteConversation',
        group: 'Conversations',
        description: 'Delete a conversation by id',
        params: {
            id: {type: 'String', required: true, description: 'The conversation identifier'}
        }
    }),

    function (req, res) {

        var id = req.params.id.toString();

        Conversation.findByIdAndRemove(id).then(function (entities) {
            return res.status(204).send();  // HTTP 204 ok, no body
        }).catch(function (err) {
            if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation(err);// Error 500
        });

    });


router.post('/conversations/:id/actions/close',
    au.doku({
        // json documentation
        title: 'Close a conversation ',
        version: '1.0.0',
        name: 'CloseConversation',
        group: 'Conversations',
        description: 'Close a conversation ',
        params: {
            id: {type: 'String', required: true, description: 'The conversation identifier'}
        }
    }),

    function (req, res) {

        var id = req.params.id.toString();
        var query = {"completed":true, "dateEnd": new Date()};
        Conversation.findOneAndUpdate({_id: id, completed: {$eq: false}}, query, {new: true}).
        then(function (entities) {
            if (_.isEmpty(entities)) {

                return Promise.reject({
                    name: 'ItemNotFound',
                    message: 'No conversation found having id ' + id_c +' with status completed=true',
                    errorCode: 404
                });
            }
            else
            return res.send(entities);  // HTTP 200 ok
        }).catch(function (err) {
            if (err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation(err);// Error 500
        });

    });

module.exports = router;