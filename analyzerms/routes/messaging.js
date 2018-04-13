const express = require('express');
const router = express.Router();
const Message = require('../models/message').Message;
const version = require('../package.json').version;
const config = require('propertiesmanager').conf;
const security = require('../middleware/security');
const _ = require('underscore')._;

var auth = require('tokenmanager');
var authField = config.decodedTokenFieldName;

//var gwBase=_.isEmpty(config.apiGwAuthBaseUrl) ? "" : config.apiGwAuthBaseUrl;
//gwBase=_.isEmpty(config.apiVersion) ? gwBase : gwBase + "/" + config.apiVersion;

auth.configure({
  authorizationMicroserviceUrl:config.authUrl + '/tokenactions/checkiftokenisauth',
  decodedTokenFieldName: authField,
  authorizationMicroserviceToken: config.auth_token
})


console.prod = function(arg) {
  if(process.env.NODE_ENV != 'test') {
    console.log(arg);
  }
}

router.get("/", (req, res, next) => {res.json({ms:"CAPORT2020 messaging  microservice", version:require('../package.json').version})});

/**
 * @api {post} /message Send a message to a specific room
 * @apiGroup Messaging
 *
 * @apiDescription Send a text message to the scpecified room. 
 *                 The message and its metatada (date, sender id, room id) are stored into db and an event
 *                 "message" is emitted on websocket on specified room
 *
 * @apiParamExample {json} Request-Example:
 * HTTP/1.1 POST request
 *  Body:{ "text": "Hi, how are you" , "room":"", "type":"crocierista", "name":"nome", "surname":"cognome"}
 *
*

 * @apiSuccess (200) {Object} body A Json containing the stored message.
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "filecode": "ABCDEFG1234",
 *       "failed": ["chunk1", "chunk2"]
 *     }
 */
router.post('/message', [security.authWrap], (req, res, next) => {
  let text = req.body.text;
  let room = req.body.room;
  let sender = req.body.sender;
  let aux = req.body.aux;

  if(!text)
    return res.boom.badRequest("Missing message text");

  if(!room)
    return res.boom.badRequest("Missing room");

  let msg = {}
  msg.room = room;
  msg.text = text;

  if(sender)
    msg.sender = sender;

  if(aux)
    msg.aux = aux;

  Message.create(msg).then(function(entities){
    if (_.isEmpty(entities))
    {
      res.boom.badImplementation('Internal Server Error'); // Error 500
      console.error("Empty entities. Message not created ?")
    }
    else
    {
      req.app.get("socketio").to(room).emit("message", entities);
      return res.status(201).send(entities); // HTTP 201 created
    }
  }).catch(function (err) {
    if (err.name === 'ValidationError') {
      console.log(err);
      return res.boom.badData(err);
    }
    // Error 422
    else
      return res.boom.badImplementation(err); // Error 500
  });
});


/**
 * @api {get} /messages/:room Return all messages from a room
 * @apiGroup Messaging
 *
 * @apiDescription Retrieves all messages stored inside the specified room.
 * #apiParam  {String} room  The room identifier.
 *
 * @apiSuccess (200) {Object} body A JSON containing all messages of the room
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       [
 *         {
 *           "text": "What's up ?",
 *           "date": "2016-10-31 10:51:58.203Z"
 *           "sender": "57f50b37e8094b7137fa3efe",
 *           "room" : "r1"
 *         }, 
 *         {
 *           "text": "I'm ok",
 *           "date": "2016-10-31 10:52:07.101Z"
 *           "sender": "57f51c1be8094b7137fa3f04",
 *           "room" : "r1"
 *         }
 *       ]
 *     }
 */
router.get('/messages/:room', [security.authWrap], (req, res, next) => {
  let room = req.params.room;

  if(!room) res.boom.badRequest("Missing room");

  var query = {
    "room": room 
  };

  Message.find(query, "text date sender room").lean().exec().then(function(result){
    return res.send(result);
  });

  
});

/**
 * @api {get} /message/:id Return a specific message
 * @apiGroup Messaging
 *
 * @apiDescription Retrieves a message identified by a specific id.
 * #apiParam  {String} id  The message identifier.
 *
 * @apiSuccess (200) {Object} body A JSON containing the requested message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *           "_id": "59e9be1da6b290663a3e1e18",
 *           "text": "What's up ?",
 *           "date": "2016-10-31 10:51:58.203Z"
 *           "sender": "57f50b37e8094b7137fa3efe",
 *           "room" : "r1"
 *     }
 */
router.get('/message/:id', [security.authWrap], (req, res, next) => {
  let id = req.params.id;

  if(!id) 
    return res.boom.badRequest("Missing id");

  if(!require("mongoose").Types.ObjectId.isValid(id))
    return res.boom.badRequest("Invalid message id")

  Message.findById(id).lean().exec().then(function(result){
    if (_.isEmpty(result))
      return res.boom.notFound('No message with id ' + id); // Error 404

    return res.send(result);
  }); 
});


/**
 * @api {get} /messages?id= Return a group of messages
 * @apiGroup Messaging
 *
 * @apiDescription Retrieves messages identified by ids.
 * #apiParam  {String} id  A list of messages identifiers.
 *
 * @apiSuccess (200) {Object} body A JSON containing the requested messages
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       [
 *         {
 *           "text": "What's up ?",
 *           "date": "2016-10-31 10:51:58.203Z"
 *           "sender": "57f50b37e8094b7137fa3efe",
 *           "room" : "r1"
 *         }, 
 *         {
 *           "text": "I'm ok",
 *           "date": "2016-10-31 10:52:07.101Z"
 *           "sender": "57f51c1be8094b7137fa3f04",
 *           "room" : "r1"
 *         }
 *       ]
 *     }
 *
 */
router.get('/messages', [security.authWrap], (req, res, next) => {
  let ids = req.query.id;

  if(!ids) 
    return res.boom.badRequest("Missing id");

  var arrId = [];
  if(!Array.isArray(ids))
    ids = [ids];

  for(i in ids)
  {
    if(!require("mongoose").Types.ObjectId.isValid(ids[i]))
      return res.boom.badRequest("Invalid message id")
   
    arrId.push(require("mongoose").Types.ObjectId(ids[i]));
  }

  
  Message.find({"_id" : {$in: arrId}}).lean().exec().then(function(result){
    if (_.isEmpty(result))
      return res.boom.notFound('No message with id ' + id); // Error 404

    return res.send(result);
  }); 
});


module.exports = router;
