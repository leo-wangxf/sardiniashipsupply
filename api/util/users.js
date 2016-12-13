var Promise = require('bluebird');
var request = require('request');
var User = require('../models/users').User;


function addRates(uid, product_rate, delivery_rate, overall_rate)
{
  var r = {}

  if(product_rate != undefined && delivery_rate == undefined && 
     overall_rate == undefined && typeof product_rate == "object")
  {
    r.product_rate = product_rate.product_rate;
    r.delivery_rate = product_rate.delivery_rate;
    r.overall_rate = product_rate.overall_rate;
  }
  else
  {
    r = {
      "product_rate": product_rate,
      "delivery_rate": delivery_rate,
      "overall_rate" : overall_rate
    }
  }

  var rp = false;
  for(var k in r)
  {
    if(r[k] != undefined)
    {
      rp = true;
      continue;
    }
  }

  if(!rp)
  {
    var err = new Error();
    err.message = "Missing rate/s";

    return new Promise(function(resolve, reject)
    {
     return reject(err);
    }); 
  }

  var query = {
    "_id" : uid
  }

  return User.find(query).limit(1).then(function(result){
    if(result.length == 0)
    {
      var err = new Error();
      err.message = "User not found";

      return new Promise(function(resolve, reject)
      {
       return reject(err);
      });
    }

    var rates = result[0].rates;
    if(rates == undefined) rates = {};

    var update = {$set: {}};

    for(var k in r)
    {
      if(r[k] != undefined)
      {
        if(isNaN(r[k]))
        {
          var err = new Error();
          err.message = k + " is not a number";

          return new Promise(function(resolve, reject)
          {
            return reject(err);
          }); 
        }

        if(typeof r[k] != "number")
        {
          r[k] = parseFloat(r[k]);
        } 

        var avg_r = 0;
        var count_r = 0;

        var db_avg_r = rates["avg_" + k];
        var db_count_r = rates["count_" + k];

        if(db_count_r != undefined)
        {
          avg_r = ((db_avg_r * db_count_r) + r[k]) / (db_count_r + 1);
          count_r = db_count_r + 1;
        }

        if(count_r == 0)
        {
          count_r = 1;
          avg_r = r[k];
        }

        update["$set"]["rates." + "avg_" + k] = avg_r;
        update["$set"]["rates." + "count_" + k] = count_r;
      }
    }
    return User.findOneAndUpdate(query, update, {safe:true, new:true, upsert:true}).exec();
  });
}

function addProductRate(uid, product_rate)
{
  return addRates(uid, product_rate, undefined, undefined);
}

function addDeliveryRate(uid, delivery_rate)
{
  return addRates(uid, undefined, delivery_rate, undefined);
}

function addOverallRate(uid, overall_rate)
{
  return addRates(uid, undefined, undefined, overall_rate);
}
  

exports.addRates  = addRates;
exports.addProductRate = addProductRate;
exports.addDeliveryRate = addDeliveryRate;
exports.addOverallRate = addOverallRate;
