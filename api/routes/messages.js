var express = require('express');
var Message = require('../models/messages').Message;
var Conversation = require('../models/conversations').Conversation;
//var util = require('util');
var _ = require('underscore')._;
var router = express.Router();
var au = require('audoku');
var ObjectId = require('mongoose').Types.ObjectId;
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


       // var allowedFields = ["type"];


        var id = req.params.id.toString();
console.log(query);
        Conversation.findById(id, "messages").then(function (entities) {
            if (_.isEmpty(entities))
                return Promise.reject({
                    name:'ItemNotFound',
                    message: 'no conversation found for getting messages, having id ' + id,
                    errorCode: 404
                });
            else{
                query = {"_id": {$in:entities.messages}};

                return  Message.paginate(query, {page: req.query.page, limit: req.query.limit});
            }



        }).then(function (results){
            if (results.total === 0){
                return Promise.reject({
                    name:'ItemNotFound',
                    message: 'No Messages found for query ' + JSON.stringify(query),
                    errorCode: 404
                });
            }
            else{
                res.status(200).send(results); // HTTP 200 ok
            }


        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

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
           sender: {type: 'String', required: true, description: 'Sender user'},
            type:{type: 'String', description: 'Type sender user', options: ['customer', 'supplier'], required:true},
            dateIn: {type: 'Date', description: 'Start message date ', required: true},
            text: {type: 'String', description: 'Message text ', required: true},
            draft: {type: 'Boolean', description: 'Message as draft ', required: true},
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
                    name:'ItemNotFound',
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

          // console.log(req.app.get("socketio").emit("messages_id"+newmsg._id));

            // var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

            //  res.set('Location', fullUrl + "/" + id + '/messages/' + newmessage._id);
            //res.status(201).send(newmessage);

            res.status(201).send(newmsg);  // HTTP 201 created

        }).catch(function (err) {

            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if (err.name === 'ValidationError')
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
        var id = req.params.id.toString();

        var newVals = req.body; // body already parsed


        Message.findById(id, newVals).then(function(entity){
            if (_.isEmpty(entity)){
               // console.log("empty");
                return Promise.reject({
                    name:'ItemNotFound',
                    message: 'No entry with id '+ id, // Error 404
                    errorCode: 404
                });
            }
            else
                res.send(entity);

        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else if(err.name === 'CastError')
                res.boom.badData('Id malformed'); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        })

    }
);


var putCallback = function (req, res) {

    if (_.isEmpty(req.body))
        return res.boom.badData('Empty boby'); // Error 422

    var id = req.params.id.toString();

    var newVals = req.body; // body already parsed

    Message.findByIdAndUpdate(id, newVals).then(function(entity){
        if (_.isEmpty(entity)){
            // console.log("empty");
            return Promise.reject({
                name:'ItemNotFound',
                message: 'No entry with id '+ id, // Error 404
                errorCode: 404
            });
        }
        else
            res.send(entity);

    }).catch(function (err) {
        if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
        else if(err.name === 'ValidationError')
             res.boom.badData(err.message); // Error 422
        else if (err.name === 'CastError')
             res.boom.badData('Id malformed'); // Error 422
        else
             res.boom.badImplementation(err);// Error 500

    })






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
            sender: {type: 'String', required: true, description: 'Sender user'},
            type:{type: 'String', description: 'Type sender user', options: ['customer', 'supplier'], required:true},
            dateIn: {type: 'Date', description: 'Start message date ', required: true},
            text: {type: 'String', description: 'Message text ', required: true},
            draft: {type: 'Boolean', description: 'Message as draft ', required: true},
            attachments: {type: 'Array', description: 'List of attachments '},
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
            sender: {type: 'String', required: true, description: 'Sender user'},
            type:{type: 'String', description: 'Type sender user', options: ['customer', 'supplier'], required:true},
            dateIn: {type: 'Date', description: 'Start message date ', required: true},
            text: {type: 'String', description: 'Message text ', required: true},
            draft: {type: 'Boolean', description: 'Message as draft ', required: true},
            attachments: {type: 'Array', description: 'List of attachments '},
        }
    }), putCallback
);


/* DELETE a message in a conversation */
router.delete('/conversations/:id_c/messages/:id_m',
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

        var idC = req.params.id_c.toString();
        var idM = req.params.id_m.toString();

      /*  if (_.isEmpty(req.body))
            return res.boom.badData('Empty body'); // Error 422
*/
      // var id = req.params.id.toString();

        var saveResults;
        var msg;
        Conversation.findById(idC, "messages").then(function (results) {
            saveResults = results;
            if (_.isEmpty(results)){

                return Promise.reject({
                    name:'ItemNotFound',
                    message: 'no conversation found for message deletion, having id ' + idC,
                    errorCode: 404
                });
            }

            else
               return Message.findByIdAndRemove(idM);
        }).
        then( function (entity) {
                   if (_.isEmpty(entity)){
                        return Promise.reject({
                            name:'ItemNotFound',
                            message: 'No entry with id '+ idM, // Error 404
                            errorCode: 404
                        });
                    }
                    else
                        saveResults.messages.pull(idM);
                        msg = entity;
                        return saveResults.save();

                }).
                then(function (results) {

            // var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

            //  res.set('Location', fullUrl + "/" + id + '/messages/' + newmessage._id);
            //res.status(201).send(newmessage);
            res.status(204).send(msg);  // HTTP 201 deleted

        }).catch(function (err) {
            if (err.name === 'ItemNotFound')  res.boom.notFound(err.message); // Error 404
            else  if (err.name === 'ValidationError')
                res.boom.badData(err.message); // Error 422
            else
                res.boom.badImplementation('something blew up, ERROR:' + err);

        });

    });


module.exports = router;