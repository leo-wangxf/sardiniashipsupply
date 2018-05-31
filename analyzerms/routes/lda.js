const express = require('express');
const router = express.Router();
const User = require('../models/users.js').User;
const Evaluation = require('../models/evaluations.js').Evaluation;
const LDA = require('../models/lda.js').LDA;
const version = require('../package.json').version;
const config = require('propertiesmanager').conf;
const security = require('../middleware/security');
const _ = require('underscore')._;
const TOPICS = 1;
const TERMS = 10;

var auth = require('tokenmanager');
var authField = config.decodedTokenFieldName;
var lda = require('lda');


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

router.get("/", (req, res, next) => {res.json({ms:"CAPORT2020 analyzer  microservice", version:require('../package.json').version})});

/**
 * @api {post} /marketBasketAnalysis  TO BE CHANGED
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

router.post('/lda', [security.authWrap], (req, res, next) => {
  LDA.update({"valid": true}, {"valid": false}, {multi: true}).then(function(results) {
  return User.find({'type':'supplier'});
  }).then(function(results) {
    for(var a in results) {
        Evaluation.find({to:require("mongoose").Types.ObjectId(results[a]["_id"])}).then(function(results){
          var pros = [];
          var cons = [];
          for (var i in results) {
            //console.log(results[i].pros_review);
            //console.log(results[i].cons_review);

             if (results[i].pros_review != undefined && results[i].pros_review.trim()!= '') {
               pros.push(results[i].pros_review);
             };
             if (results[i].cons_review != undefined && results[i].cons_review.trim()!= '') {
               cons.push(results[i].cons_review);
             };
          }; 
          var lda_output_pros = [];
          if (pros.length > 0) {
            lda_output_pros = lda(pros, TOPICS, TERMS);
          };
          var lda_output_cons = [];
          if (cons.length > 0) {
            lda_output_cons = lda(cons, TOPICS, TERMS);
          };
          if (results.length > 0) {
             LDA.create({supplier:results[0].to, pros_topics:lda_output_pros, cons_topics:lda_output_cons});
             }

    /*for(var id in output.rankedScoreMap){
       User.findByIdAndUpdate(id, {$set : {"rates.ahprank":output.rankedScoreMap[id]}},{new:true}).exec();
    }*/
  });
    };
    return res.status(200).send("{STATUS: 'OK'}"); // HTTP 201 created
  }).catch(function(error){console.log(error);});


  });
   





/**
 * @api {get} /marketBasketAnalysis  TO BE CHANGED
 * @apiGroup MarketBAsketAnalysis
 *
 * @apiDescription Return a products association (if it exists) 
 *
 * @apiParamExample {json} Request-Example:
 * HTTP/1.1 POST request
 *
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

router.get('/lda', [security.authWrap], (req, res, next) => {

  var id = req[authField]['_id'];
  //id = "5b0c0cc58e90c319a11b5af4";


  LDA.find({"valid": true, "supplier": {$all: require('mongoose').Types.ObjectId(id)}}, "-_id").then(function(result)
  {
    if (_.isEmpty(result))
      res.boom.notFound('Topics DO NOT exist'); // Error 404
    else
      res.send(result);
  }).catch(function(err){
    console.log(err);
      res.boom.notFound('Topics DO NOT exist'); // Error 404
  });

});


/**
 * @api {get} /marketBasketAnalysis  TO BE CHANGED
 * @apiGroup MarketBAsketAnalysis
 *
 * @apiDescription Return a products association (if it exists) 
 *
 * @apiParamExample {json} Request-Example:
 * HTTP/1.1 POST request
 *
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

router.get('/lda/:id', [security.authWrap], (req, res, next) => {
  var id = req.params.id;

  LDA.find({"valid": true, "supplier": {$all: require('mongoose').Types.ObjectId(id)}}, "-_id").then(function(result)
  {
    if (_.isEmpty(result))
      res.boom.notFound('Topics DO NOT exist'); // Error 404
    else
      res.send(result);
  });

});

module.exports = router;
