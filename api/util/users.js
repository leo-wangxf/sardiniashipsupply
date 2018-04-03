var Promise = require('bluebird');
var config = require('propertiesmanager').conf;
var request = require('request');
var User = require('../models/users').User;
var math = require('mathjs');

// http://www.evanmiller.org/ranking-items-with-star-ratings.html
// http://bajiecc.cc/questions/36055/what-is-a-better-way-to-sort-by-a-5-star-rating
function bayesianStarRating(ratings)
{
  // 1 - alpha/2 quantile of a normal distribution
  // 95% confidence (based on the Bayesian posterior distribution) 
  // that the actual sort criterion is at least as big as the computed 
  // sort criterion
  var z = 1.65

  // Total ratings for element
  var N = ratings.reduce(function(a, b){return a + b;}, 0);
  // Number of possible ratings
  var K = ratings.length;
  // Array of possible rating values
  // [5, 4, 3, 2, 1]
  var s = Array.from(Array(K).keys()).map(function(value){return value + 1;}).reverse();
  // Square of s
  //[25, 16, 9, 4, 1]
  var s2 = s.map(function(val){return math.pow(val, 2);});
  
  var f = function(s, ns)
  {
    var N = ns.reduce(function(a, b){return a+b;}, 0);;
    var K = ns.length;
    
    // sum s_i * (ns_i + 1)/ N + K
    return s.reduce(function(total, elem, i){return total + (elem * (ns[i] + 1));}, 0) / (N + K);
  }

  var fsns = f(s, ratings);
  return fsns - z * math.sqrt((f(s2, ratings) - math.pow(fsns, 2)) / (N + K + 1)); 
}


function addRates(uid, product_rate, delivery_rate, overall_rate, customer_service_rate, price_value_rate)
{
  var r = {}

  if(typeof product_rate == "object")
  {
    r.product_rate = product_rate.product_rate;
    r.delivery_rate = product_rate.delivery_rate;
    r.overall_rate = product_rate.overall_rate;
    r.customer_service_rate = product_rate.customer_service_rate;
    r.price_value_rate = product_rate.price_value_rate;
  }
  else
  {
    r = {
      "product_rate": product_rate,
      "delivery_rate": delivery_rate,
      "overall_rate" : overall_rate,
      "customer_service_rate" : customer_service_rate,
      "price_value_rate" : price_value_rate
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

        var stars_count = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
        var bayesian_r = 0;

        

        var db_avg_r = rates["avg_" + k];
        var db_count_r = rates["count_" + k];

        var db_count_single_rates = rates["stars_count_" + k];        
        var db_bayesian_r = rates["bayesian_" + k];        
        
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


        if(db_count_single_rates != undefined)
        {
          if([1, 2, 3, 4, 5].includes(r[k]))
          {
            db_count_single_rates[r[k]] += 1;
            stars_count = db_count_single_rates;
            var sca = [];
            for(var i = 5; i >0; i--)
            {
              sca.push(stars_count[i]);
            }
            bayesian_r = bayesianStarRating(sca);
          }
          else
          {
            // strange value ...
            stars_count = db_count_single_rates;
            bayesian_r = db_bayesian_r;
          }          
        }
        else
        {
          stars_count[r[k]] += 1;
        }

        update["$set"]["rates." + "avg_" + k] = avg_r;
        update["$set"]["rates." + "count_" + k] = count_r;

        update["$set"]["rates." + "bayesian_" + k] = bayesian_r;
        update["$set"]["rates." + "stars_count_" + k] = stars_count;
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
  
function addCustomerServiceRate(uid, customer_service_rate)
{
  return addRates(uid, undefined, undefined, undefined, customer_service_rate, undefined);
}

function addPriceValueRate(uid, price_value_rate)
{
  return addRates(uid, undefined, undefined, undefined, undefined, price_value_rate);
}



function signIn(email, password)
{
  var options =
  {
    url: config.authMsUrl + "/authuser/signin",
    //url: config.userMsUrl + "/users/signin",
    method: 'POST',
    json: true,
    body: {"username" : email, "password" : password},
    headers:
    {
      //'Authorization': 'Bearer ' + config.userMsToken,
      'Authorization': 'Bearer ' + config.authMsToken,
      'content-type': 'application/json'
    }
  };

  return new Promise(function(resolve, reject)
  {
    request.post(options, function(error, response, body)
    {
      if(error)
      {
        const decodeError = new Error();
        decodeError.message = error.message;
        decodeError.stack = error.stack;
        return reject(decodeError);
      }

      var r = {};
      try
      {
        r.body = JSON.parse(body);
      }
      catch(err)
      {
        r.body = body;
      }

      r.response = response;
      return resolve(r);
    });
  });
}



function signUp(email, password, type)
{
  var options =
  {
    //url: config.userMsUrl + "/users/signup",
    url: config.authMsUrl + "/authuser/signup",
    method: 'POST',
    json: true,
    body: {"user" : {"email" : email, "password": password, "type": type}},
    headers:
    {
      //'Authorization': 'Bearer ' + config.userMsToken,
      'Authorization': 'Bearer ' + config.authMsToken,
      'Content-type': 'application/json'
    }
  };

  return new Promise(function(resolve, reject)
  {
    request.post(options, function(error, response, body)
    {
      if(error)
      {
        console.log(error);
        const decodeError = new Error();
        decodeError.message = error.message;
        decodeError.stack = error.stack;
        return reject(decodeError);
      }

      var r = {};
      try
      {
        r.body = JSON.parse(body);
      }
      catch(err)
      {
        r.body = body;
      }

      r.response = response;
      return resolve(r);
    });
  });
}

function register(email, password, type)
{
  var options =
  {
    //url: config.userMsUrl + "/users/",
    url: config.authMsUrl + "/authuser/signup",
    method: 'POST',
    json: true,
    body: {"user" : {"email" : email, "password": password, "type": type}},
    headers:
    {
      //'Authorization': 'Bearer ' + token,
      'Authorization': 'Bearer ' + config.authMsToken,
      'Content-type': 'application/json'
    }
  };

  return new Promise(function(resolve, reject)
  {
    request.post(options, function(error, response, body)
    {
      if(error)
      {
        console.log(error);
        const decodeError = new Error();
        decodeError.message = error.message;
        decodeError.stack = error.stack;
        return reject(decodeError);
      }

      var r = {};
      try
      {
        r.body = JSON.parse(body);
      }
      catch(err)
      {
        r.body = body;
      }

      r.response = response;
      return resolve(r);
    });
  });
}

/*
function getProfile(userId, token)
{
  var options =
  {
    url: config.userMsUrl + "/users/" + userId,
    method: 'GET',
    json: true,
    headers:
    {
      'Authorization': 'Bearer ' + token,
      'content-type': 'application/json'
    }
  };

  return new Promise(function(resolve, reject)
  {
    request.get(options, function(error, response, body)
    {
      if(error)
      {
        const decodeError = new Error();
        decodeError.message = error.message;
        decodeError.stack = error.stack;
        return reject(decodeError);
      }

      var r = {};
      try
      {
        r.body = JSON.parse(body);
      }
      catch(err)
      {
        r.body = body;
      }

      r.response = response;
      return resolve(r);
    });
  });
}
*/

function resetPassword(uid, password, token)
{
  var options =
  {
    //url: config.userMsUrl + "/users/" + email + "/actions/setpassword",
    url: config.authMsUrl + "/authuser/" + uid + "/actions/setpassword",
    method: 'POST',
    json: true,
    body: {"newpassword": password, "reset_token": token},
    headers:
    {
      //'Authorization': 'Bearer ' + config.userMsToken,
      'Authorization': 'Bearer ' + config.authMsToken,
      'content-type': 'application/json'
    }
  };

  return new Promise(function(resolve, reject)
  {
    request.post(options, function(error, response, body)
    {
      if(error)
      {
        const decodeError = new Error();
        decodeError.message = error.message;
        decodeError.stack = error.stack;
        return reject(decodeError);
      }

      var r = {};
      try
      {
        r.body = JSON.parse(body);
      }
      catch(err)
      {
        r.body = body;
      }

      r.response = response;
      return resolve(r);
    });
  });
}


function changePassword(uid, token, oldPassword, newPassword)
{
  var options =
  {
    //url: config.userMsUrl + "/users/" + uid + "/actions/setpassword",
    url: config.authMsUrl + "/authuser/" + uid + "/actions/setpassword",
    method: 'POST',
    json: true,
    body: {"oldpassword" : oldPassword, "newpassword" : newPassword},
    headers:
    {
      //'Authorization': 'Bearer ' + token,
      'Authorization': 'Bearer ' + config.authMsToken,
      'content-type': 'application/json'
    }
  };

  return new Promise(function(resolve, reject)
  {
    request.post(options, function(error, response, body)
    {
      if(error)
      {
        const decodeError = new Error();
        decodeError.message = error.message;
        decodeError.stack = error.stack;
        return reject(decodeError);
      }

      var r = {};
      try
      {
        r.body = JSON.parse(body);
      }
      catch(err)
      {
        r.body = body;
      }

      r.response = response;
      return resolve(r);
    });
  });
}



function getResetPasswordToken(uid)
{
  var options =
  {
    //url: config.userMsUrl + "/users/" + uid + "/actions/resetpassword",
    url: config.authMsUrl + "/authuser/" + uid + "/actions/resetpassword",
    method: 'POST',
    json: true,
    headers:
    {
      //'Authorization': 'Bearer ' + config.userMsToken,
      'Authorization': 'Bearer ' + config.authMsToken,
      'content-type': 'application/json'
    }
  };

  return new Promise(function(resolve, reject)
  {
    request.post(options, function(error, response, body)
    {
      if(error)
      {
        const decodeError = new Error();
        decodeError.message = error.message;
        decodeError.stack = error.stack;
        return reject(decodeError);
      }

      var r = {};
      try
      {
        r.body = JSON.parse(body);
      }
      catch(err)
      {
        r.body = body;
      }

      r.response = response;
      return resolve(r);
    });
  });
}


function deleteUser(uid)
{
  var options =
  {
    //url: config.userMsUrl + "/users/" + uid,
    url: config.authMsUrl + "/authuser/" + uid,
    method: 'DELETE',
    json: true,
    headers:
    {
      //'Authorization': 'Bearer ' + token,
      'Authorization': 'Bearer ' + config.authMsToken,
      'content-type': 'application/json'
    }
  };

  return new Promise(function(resolve, reject)
  {
    request.delete(options, function(error, response, body)
    {
      if(error)
      {
        const decodeError = new Error();
        decodeError.message = error.message;
        decodeError.stack = error.stack;
        return reject(decodeError);
      }

      var r = {};
      try
      {
        r.body = JSON.parse(body);
      }
      catch(err)
      {
        r.body = body;
      }

      r.response = response;
      return resolve(r);
    });
  });
}
exports.deleteUser = deleteUser;

exports.getResetPasswordToken = getResetPasswordToken;
exports.signIn = signIn;
exports.register = register;
exports.signUp = signUp;
//exports.getProfile = getProfile;
exports.changePassword = changePassword;
exports.resetPassword = resetPassword;

exports.addRates  = addRates;
exports.addProductRate = addProductRate;
exports.addDeliveryRate = addDeliveryRate;
exports.addOverallRate = addOverallRate;
exports.addCustomerServiceRate = addCustomerServiceRate;
exports.addPriceValueRate = addPriceValueRate;
