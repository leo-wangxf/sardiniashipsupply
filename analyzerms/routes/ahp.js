const express = require('express');
const router = express.Router();
const User = require('../models/users.js').User;
//const MBA = require('../models/marketBasketAnalysis.js').MarketBasketAnalysis;
const version = require('../package.json').version;
const config = require('propertiesmanager').conf;
const security = require('../middleware/security');
const _ = require('underscore')._;

var auth = require('tokenmanager');
var authField = config.decodedTokenFieldName;
var AHP = require('ahp');


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

router.post('/ahp', [security.authWrap], (req, res, next) => {
  var ahp_context = new AHP();
  User.find({'type':'supplier'}).then(function(results) {
    var price = [];
    var customer_service = [];
    var delivery = [];
    var product = [];
    var suppliers = [];
    for(var a in results) {
        if (results[a].rates == undefined) continue;
        if (results[a].rates.bayesian_overall_rate == undefined) continue;
        suppliers.push(results[a]._id);
        var price_value_A = 0;
        var customer_service_value_A = 0;
        var delivery_value_A = 0;
        var product_value_A = 0;
        if (results[a].rates.bayesian_price_value_rate != undefined){
          price_value_A = results[a].rates.bayesian_price_value_rate
        } else {
          price_value_A = results[a].rates.bayesian_overall_rate;
        }
        if (results[a].rates.bayesian_customer_service_rate != undefined){
          customer_service_value_A = results[a].rates.bayesian_customer_service_rate
        } else {
          customer_service_value_A = results[a].rates.bayesian_overall_rate;
        }
        if (results[a].rates.bayesian_delivery_rate != undefined){
          delivery_value_A = results[a].rates.bayesian_delivery_rate
        } else {
          delivery_value_A = results[a].rates.bayesian_overall_rate;
        }
        if (results[a].rates.bayesian_product_rate != undefined){
          product_value_A = results[a].rates.bayesian_product_rate
        } else {
          product_value_A = results[a].rates.bayesian_overall_rate;
        }
      for(var b in results) {
        if (results[b].rates == undefined) continue;
        if (results[b].rates.bayesian_overall_rate == undefined) continue;
        var price_value_B = 0;
        var customer_service_value_B = 0;
        var delivery_value_B = 0;
        var product_value_B = 0;
        if (results[b]._id == results[a]._id) continue;
        if (results[b].rates.bayesian_price_value_rate != undefined){
          price_value_B = results[b].rates.bayesian_price_value_rate
        } else {
          price_value_B = results[b].rates.bayesian_overall_rate;
        }
        if (results[b].rates.bayesian_customer_service_rate != undefined){
          customer_service_value_B = results[b].rates.bayesian_customer_service_rate
        } else {
          customer_service_value_B = results[b].rates.bayesian_overall_rate;
        }
        if (results[b].rates.bayesian_delivery_rate != undefined){
          delivery_value_B = results[b].rates.bayesian_delivery_rate
        } else {
          delivery_value_B = results[b].rates.bayesian_overall_rate;
        }
        if (results[b].rates.bayesian_product_rate != undefined){
          product_value_B = results[b].rates.bayesian_product_rate
        } else {
          product_value_B = results[b].rates.bayesian_overall_rate;
        }
        var price_A_over_B = ((8*((price_value_A/price_value_B)-(1/5)))/(5-(1/5)))+1;
        price.push([results[a]._id, results[b]._id, price_A_over_B]);
        /*console.log('\n\n price_value_A = '+ price_value_A);
        console.log('price_value_B = '+ price_value_B);
        console.log('price_value_A/price_value_B '+ (price_value_A/price_value_B));
        console.log('price_A_over_B '+ price_A_over_B);
        */
        //if ((price_A_over_B) > 9 || (price_A_over_B) < 1) {console.log('\n\n ===> PRIZE out of range!' + price_A_over_B);}
        var customer_service_A_over_B = ((8*((customer_service_value_A/customer_service_value_B)-(1/5)))/(5-(1/5)))+1;
        customer_service.push([results[a]._id, results[b]._id, customer_service_A_over_B]);
        var delivery_A_over_B = ((8*((delivery_value_A/delivery_value_B)-(1/5)))/(5-(1/5)))+1;
        delivery.push([results[a]._id, results[b]._id, delivery_A_over_B]);
        var product_A_over_B = ((8*((product_value_A/product_value_B)-(1/5)))/(5-(1/5)))+1;
        product.push([results[a]._id, results[b]._id, product_A_over_B]);
      } // end second loop
    }// end first loop
    ahp_context.addItems(suppliers);
    ahp_context.addCriteria(['price','customer','delivery','product']);
    ahp_context.rankCriteriaItem('price',price);
    ahp_context.rankCriteriaItem('customer',customer_service);
    ahp_context.rankCriteriaItem('delivery',delivery);
    ahp_context.rankCriteriaItem('product',product);
    ahp_context.rankCriteria([
        ['product','customer',5],
        ['product','delivery',1],
        ['product','price',1/3],
        ['customer','delivery',1/5],
        ['customer','price',1/5],
        ['delivery','price',1/3],
        ]);
    var output = ahp_context.run();
    //console.log(output);
    //output.rankedScoreMap 

    /*let analyticContext = ahp_context.debug();
    for(let key in analyticContext){
      console.log(`${key}: `, analyticContext[key], '\n');
    }*/


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
