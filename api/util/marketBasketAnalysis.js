var Promise = require('bluebird');
var request = require('request');
var User = require('../models/users').User;
var Conversations = require('../models/conversations').Conversation;
var math = require('mathjs');
var Apriori = require('apriori');


//new Apriori.Algorithm(0.15, 0.1, false).showAnalysisResultFromFile('retail2_5000.dat');



function apriori()
{
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


    for(var i in results)
    {
      var transaction = [];
      
      for(var j in results[i].products)
      {
        transaction = transaction.concat(results[i].products[j].request);
        //transaction.push.apply(transaction, results[i].products[j].request);
      }
      transactions.push(transaction);

    }
    //console.log(transactions);

    var minSupport = 0.00005;
    var minConfidence = 0.0000000005;
    var debugMode = false;

    var analysisResult = new Apriori.Algorithm(minSupport, minConfidence, debugMode).analyze(transactions);
    console.log(JSON.stringify(analysisResult));
    

  });

  
}

exports.apriori = apriori;
