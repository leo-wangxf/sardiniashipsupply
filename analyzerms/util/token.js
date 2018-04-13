var Promise = require('bluebird');
var request = require('request');
var config = require('propertiesmanager').conf;
var _ = require('underscore')._;


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
    url:  config.authUrl + "/tokenactions/decodeToken",
    method: 'POST',
    json: true,
    body: {"decode_token" : token},
    headers:
    {
      'Authorization': 'Bearer ' + config.auth_token
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

exports.decodeToken  = decodeToken;

