const express = require('express');
const router = express.Router();
const Conversations = require('../models/conversations').Conversation;
const Requests = require('../models/requests').Request;
const MBA = require('../models/marketBasketAnalysis.js').MarketBasketAnalysis;
const version = require('../package.json').version;
const config = require('propertiesmanager').conf;
const security = require('../middleware/security');
const _ = require('underscore')._;

var auth = require('tokenmanager');
var authField = config.decodedTokenFieldName;
var Apriori = require('apriori');

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

router.post('/marketBasketAnalysis', [security.authWrap], (req, res, next) => {


  var transactions = [];
  var associationRules;
/*
  Conversations.aggregate(
  [{
    $group:
    {
      "_id": {
                customer: "$customer", day:{$dayOfYear:"$dateIn"}, 
                year:{$year:"$dateIn"}
              },
      "products": {$push:{request: "$requests", dateIn: "$dateIn"}}
    }
  }]).then(function(results){
*/


  Conversations.aggregate(
  [{
    $group:
    {
      "_id": {
                customer: "$customer", day:{$dayOfYear:"$dateIn"}, 
                year:{$year:"$dateIn"}
              },
      "requests": {$push:{request: "$requests", dateIn: "$dateIn"}}
    }
  }]).then(function(results){

    return Conversations.populate(results, {path: "requests.request", select: "product"});
  }).then(function(results){

    //console.log(JSON.stringify(results));
    for(var i in results)
    {
      var transaction = [];
      for(var j in results[i].requests)
      {
        for(var k in results[i].requests[j].request)
        {
          if(transaction.indexOf("" + results[i].requests[j].request[k].product) < 0)
          {
            //transaction = transaction.concat(results[i].requests[j].request[k].product);
            transaction.push("" + results[i].requests[j].request[k].product);
          }
          //transaction.push.apply(transaction, results[i].products[j].request);
        }
      }
      transactions.push(transaction);

    }
    var minSupport = req.body.support;
    var minConfidence = req.body.confidence;
    var debugMode = false;

    var analysisResult = new Apriori.Algorithm(minSupport, minConfidence, debugMode).analyze(transactions);
    //console.log(JSON.stringify(analysisResult.associationRules));
    //console.log(JSON.stringify(analysisResult.frequentItemSets));
    associationRules = analysisResult.associationRules; 
    
    return MBA.update({"valid": true}, {"valid": false});
  }).then(function(results){
    for(var i in associationRules)
    {
      MBA.create(associationRules[i]);      
    }
    
    return res.status(200).send("{STATUS: 'OK'}"); // HTTP 201 created

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

router.get('/marketBasketAnalysis/actions/association', [security.authWrap], (req, res, next) => {
  var lhs = req.query.lhs;

  MBA.find({"valid": true, "lhs": {$all: lhs}}, "-_id").then(function(result)
  {
    if (_.isEmpty(result))
      res.boom.notFound('Association not exist'); // Error 404
    else
      res.send(result);
  });

});





module.exports = router;
