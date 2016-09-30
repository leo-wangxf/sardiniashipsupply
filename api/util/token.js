var Promise = require('bluebird');
var request = require('request');

var msToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2RlIjoibXMiLCJpc3MiOiJub3QgdXNlZCBmbyBtcyIsImVtYWlsIjoibm90IHVzZWQgZm8gbXMiLCJ0eXBlIjoiYXV0aG1zIiwiZW5hYmxlZCI6dHJ1ZSwiZXhwIjoxNzg1NTc1MjQ3NTY4fQ.Du2bFjd0jB--geRhnNtbiHxcjQHr5AyzIFmTr3NFDcM";

var authUrl = "http://seidue.crs4.it:3007";
var userUrl = "http://seidue.crs4.it:3008";


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
    url: authUrl + "/decodeToken",
    qs: {decode_token : token},
    method: 'GET',
    headers: 
    {
      'Authorization': 'Bearer ' + msToken
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
      r.body = JSON.parse(body);
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
    url: userUrl + "/users/" + uid,
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
exports.editUser  = editUser;
