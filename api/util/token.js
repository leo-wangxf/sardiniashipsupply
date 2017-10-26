var config = require('../config/default.json');
var Promise = require('bluebird');
var request = require('request');

function decodeToken(token)
{
  if (!token){
    const decodeError = new Error();
    decodeError.message = "missing authorization token";
    decodeError.statusCode = 401;
    return new Promise(function(resolve, reject)
    {
      return reject(decodeError);
    });
  }

  var options =
  {
    url: config.authMsUrl + "/tokenactions/decodeToken",
    method: 'POST',
    json: true,
    body: {"decode_token" : token},
    headers:
    {
      'Authorization': 'Bearer ' + config.authMsToken
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
      r.body = body;
      //r.body = JSON.parse(body);
      r.response = response;
      return resolve(r);
      /*
      if(response.statusCode == 200 && body)
      {
        return resolve(body);
      }
      */
    });
  });
}

function editUser(uid, token, body)
{
  var options =
  {
    url: config.userMsUrl + "/users/" + uid,
    method: 'PUT',
    json: true,
    body: body,
    headers:
    {
      'Authorization': 'Bearer ' + token,
      'content-type': 'application/json'
    }
  };

  return new Promise(function(resolve, reject)
  {
    request.put(options, function(error, response, body)
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

function loginUser(username, password)
{
  var options =
  {
    url: config.userMsUrl + "/users/signin",
    method: 'POST',
    json: true,
    body: {"username" : username, "password" : password},
    headers:
    {
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



exports.decodeToken  = decodeToken;
exports.editUser  = editUser;
exports.loginUser = loginUser;

