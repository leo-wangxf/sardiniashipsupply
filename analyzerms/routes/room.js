const express = require('express');
const router = express.Router();
const Message = require('../models/message').Message;
const Room = require('../models/room').Room;
const version = require('../package.json').version;
const config = require('propertiesmanager').conf;
const security = require('../middleware/security');
const _ = require('underscore')._;

var auth = require('tokenmanager');
var authField = config.decodedTokenFieldName;

//var gwBase=_.isEmpty(config.apiGwAuthBaseUrl) ? "" : config.apiGwAuthBaseUrl;
//gwBase=_.isEmpty(config.apiVersion) ? gwBase : gwBase + "/" + config.apiVersion;

auth.configure({
  authorizationMicroserviceUrl:config.authUrl  + '/tokenactions/checkiftokenisauth',
  decodedTokenFieldName: authField,
  authorizationMicroserviceToken: config.auth_token
})


console.prod = function(arg) {
  if(process.env.NODE_ENV != 'test') {
    console.log(arg);
  }
}

//router.get("/", (req, res, next) => {res.json({ms:"CAPORT2020 messaging  microservice", version:require('../package.json').version})});

/**
 * @api {post} /room Register a new room.
 * @apiGroup Messaging
 *
 * @apiDescription Register a new room with the members list allowed to use it. 
 *
 * @apiParamExample {json} Request-Example:
 * HTTP/1.1 POST request
 *  Body:{ 
 *         "name": "myroom",
 *         "members: ["user1", "user2"]
 *       }
 *
*

 * @apiSuccess (201) {Object} body A Json containing the id of created room.
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 201 OK
 *       {
 *         "index": 0,
 *         "_id": "59fb3715bce7272071817dcd"
 *       }
 *
 * @apiError 409_Conflict A room with this nme already exists.<BR>
 * @apiErrorExample Error-Response: 409 Conflict
 *     HTTP/1.1 409 Unauthorized
 *      {
 *        "statusCode": 409,
 *        "error": "Conflict",
 *        "message": "A room with this name already exists"
 *      }
 */
router.post('/room', [security.authWrap], (req, res, next) => {
  var members = req.body.members;
  var name = req.body.name;

  if(!name) 
    return res.boom.badRequest("Missing room name");

  if(!members) 
    return res.boom.badRequest("Missing members list");

  var arrId = [];
  if(!Array.isArray(members))
    members = [members];

  var qSearch = {"name" : name};
  var qInsert = {"name" : name, "members" : members}; 
  
  Room.update(qSearch, {$setOnInsert: qInsert}, { upsert : true }).then(function(entities){
    if (_.isEmpty(entities))
    {
      res.boom.badImplementation('Internal Server Error'); // Error 500
      console.error("Empty entities. Room not created ?")
    }
    else if(!entities.upserted)
    {
      res.boom.conflict('A room with this name already exists'); // Error 409
    }
    else
    {
      return res.status(201).send(entities.upserted[0]); // HTTP 201 created
    }
  }).catch(function (err) {
    if (err.name === 'ValidationError') {
      console.log(err);
      return res.boom.badData(err);
    }
    // Error 422
    else
    {
      console.log(err);
      return res.boom.badImplementation(err); // Error 500
    }
  });
});


/**
 * @api {get} /room/:name Return the room data
 * @apiGroup Messaging
 *
 * @apiDescription Retrieves the metadata (id, members) of a room.
 * #apiParam  {String} room  The room name.
 *
 * @apiSuccess (200) {Object} body A JSON containing all messages of the room
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *
 *     {
 *       "_id": "59fb35ecbce7272071817dcc",
 *       "name": "roomtest11",
 *       "members": [
 *                     "us111",
 *                      "us222"
 *                  ]
 *     }
 *
 *
 * @apiError (404) The room doesn't exis.<BR>
 * @apiErrorExample Error-Response: 404 Not found
 *     HTTP/1.1 404 Not Found
 *      {
 *        "statusCode": 404,
 *        "error": "Not Found",
 *        "message": "A room with this name doesn't exist "
 *      }
 */
router.get('/room/:name', [security.authWrap], (req, res, next) => {
  let name = req.params.name;

  if(!name) res.boom.badRequest("Missing room name");

  var query = {
    "name": name 
  };

  Room.findOne(query, "_id name members").lean().exec().then(function(result){
    if (_.isEmpty(result))
    {
      res.boom.notFound('A room with this name doesn\'t exist '); // Error 404
    }
    else
    {
      return res.status(200).send(result);
    }
  }).catch(function (err) {
    if (err.name === 'ValidationError') {
      console.log(err);
      return res.boom.badData(err);
    }
    // Error 422
    else
    {
      console.log(err);
      return res.boom.badImplementation(err); // Error 500
    }
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
router.get('/room/:id', [security.authWrap], (req, res, next) => {
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
router.get('/room', [security.authWrap], (req, res, next) => {
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
