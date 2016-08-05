var express = require('express');
var Message = require('../models/messages').Message;
var Conversation = require('../models/conversations').Conversation;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');

/* GET all messages  */

router.get('/conversations/:id/messages',
    au.doku({  // json documentation
        description: 'Get all the messages defined in db',
        title: 'Get messages',
        version: '1.0.0',
        name: 'GetMessages',
        group: 'Messages',
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
        // console.log("GET Messages");
        var query = _.extend({}, req.query);
        if (query.hasOwnProperty('page')) delete query.page;
        if (query.hasOwnProperty('limit')) delete query.limit;
        // console.log(query);


        var id = req.params.id.toString();
        Conversation.findById(id, "messages", function (err, entities) {  //FIXME: convert to Promises
            if (!err) {
                if (entities) {
                    //console.log(entities);

                    var filtEntity = entities.getMessagesByQuery(query);

                    query = {"_id": {$in: filtEntity}};
                    Message.paginate(query, {page: req.query.page, limit: req.query.limit}, function (err, results) {

                        if (err) return res.boom.badImplementation(err); // Error 500

                        if (results.total === 0)
                            res.boom.notFound('No Messages found for query ' + JSON.stringify(query)); // Error 404
                        else
                            res.send(results); // HTTP 200 ok
                    });


                } else
                    res.boom.notFound('no conversation found for message creation, having id ' + id);

            } else {
                res.boom.notFound('something blew up, ERROR:' + err);

            }


        });

    });

/* POST new message in a conversation */
router.post('/conversations/:id/messages',
    au.doku({  // json documentation

        description: 'Create a message in db for a specific conversation',
        title: 'Create a message',
        version: '1.0.0',
        name: 'PostMessage',
        group: 'Messages',
        bodyFields: {
            senderId: {type: 'String', required: true, description: 'Sender user'},
            dateIn: {type: 'Date', description: 'Start message date '},
            text: {type: 'String', description: 'Message text '},
            draft: {type: 'Boolean', description: 'Message as draft '},
            attachments: {type: 'Array', description: 'List of attachments '},
        }
    }),
    function (req, res) {
        console.log("POST Message");

        if (_.isEmpty(req.body))
            return res.boom.badData('Empty body'); // Error 422

        var id = req.params.id.toString();

        var saveResults;
        var newmsg;
        Conversation.findById(id, "messages").then(function (results) {
            saveResults = results;
            if (_.isEmpty(results))
                return Promise.reject({
                    message: 'no conversation found for message creation, having id ' + id,
                    errorCode: 404
                });
            else
                return Message.create(req.body);


        }).then(function (newmessage) {


            if (_.isEmpty(newmessage))
                return Promise.reject("something strange");
            else {
                saveResults.messages.push(newmessage._id);
                newmsg = newmessage;
                return saveResults.save();

            }

        }).then(function (results) {

            // var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

            //  res.set('Location', fullUrl + "/" + id + '/messages/' + newmessage._id);
            //res.status(201).send(newmessage);
            res.status(201).send(newmsg);  // HTTP 201 created

        }).catch(function (err) {

            if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });

    });
/* GET a message   */
router.get('/messages/:id',
    au.doku({  // json documentation
        title: 'Get a message by id',
        version: '1.0.0',
        name: 'GetMessage',
        group: 'Messages',
        description: 'Get a message by id',
        params: {
            id: {type: 'String', required: true, description: 'The message identifier'}
        }

    }), function (req, res) {
        var id = req.params['id'].toString();

        var newVals = req.body; // body already parsed

        Message.findById(id, newVals, function (err, entities) {   //FIXME: convert to Promises

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

    Message.findByIdAndUpdate(id, newVals, function (err, entities) { //FIXME: convert to Promises

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


router.put('/messages/:id',
    au.doku({  // json documentation
        title: 'Update a message by id',
        version: '1.0.0',
        name: 'UpdateMessage',
        group: 'Messages',
        description: 'Update a message by id',
        params: {
            id: {type: 'String', required: true, description: 'The message identifier'}
        },
        bodyFields: {
            supplierId: {type: 'String', required: true, description: 'Supplier user'},
            customerId: {type: 'String', required: true, description: 'Customer user'},
            dateIn: {type: 'Date', description: 'Start message date '},
            dateValidity: {type: 'Date', description: 'Validity message date '},
            dateEnd: {type: 'Date', description: 'End message date '},
            subject: {type: 'String', description: 'Message subject '},
            completed: {type: 'Boolean', description: 'Message completion '},
            messages: {type: 'Array', description: 'List message messages '},
            requests: {type: 'Array', description: 'List message requests '},
            hidden: {type: 'Boolean', description: 'Message visibility '}
        }
    }), putCallback
);

router.patch('/messages/:id',
    au.doku({  // json documentation
        title: 'Update a message by id (patch)',
        version: '1.0.0',
        name: 'UpdateMessage (patch)',
        group: 'Messages',
        description: 'Update a message by id',
        params: {
            id: {type: 'String', required: true}
        },
        bodyFields: {
            supplierId: {type: 'String', required: true, description: 'Supplier user'},
            customerId: {type: 'String', required: true, description: 'Customer user'},
            dateIn: {type: 'Date', description: 'Start message date '},
            dateValidity: {type: 'Date', description: 'Validity message date '},
            dateEnd: {type: 'Date', description: 'End message date '},
            subject: {type: 'String', description: 'Message subject '},
            completed: {type: 'Boolean', description: 'Message completion '},
            messages: {type: 'Array', description: 'List message messages '},
            requests: {type: 'Array', description: 'List message requests '},
            hidden: {type: 'Boolean', description: 'Message visibility '}
        }
    }), putCallback
);


router.delete('/messages/:id',
    au.doku({
        // json documentation
        title: 'Delete a message by id ',
        version: '1.0.0',
        name: 'DeleteMessage',
        group: 'Messages',
        description: 'Delete a message by id',
        params: {
            id: {type: 'String', required: true, description: 'The message identifier'}
        }
    }),

    function (req, res) {

        var id = req.params['id'].toString();

        Message.findByIdAndRemove(id, function (err, entities) {  //FIXME: convert to Promises

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