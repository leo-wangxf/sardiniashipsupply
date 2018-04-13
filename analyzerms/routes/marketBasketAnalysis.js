const express = require('express');
const router = express.Router();
const Conversations = require('../models/conversations').Conversation;
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

    console.log(results);
    for(var i in results)
    {
      var transaction = [];
      if (results[i]._id.year== 2018){
      for(var j in results[i].products)
      {
        transaction = transaction.concat(results[i].products[j].request);
        //transaction.push.apply(transaction, results[i].products[j].request);
      }
      transactions.push(transaction);

    }
    }
    //console.log(transactions);

    var minSupport = 0.00000000000005;
    var minConfidence = 0.0000000000005;
    var debugMode = false;

    var analysisResult = new Apriori.Algorithm(minSupport, minConfidence, debugMode).analyze(transactions);
    console.log(JSON.stringify(analysisResult));
    
    return res.status(200).send("{STATUS: 'OK'}"); // HTTP 201 created

  });
   
});


module.exports = router;
