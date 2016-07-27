var Promise = require('bluebird');
var request = require('request');

var msToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2RlIjoibXMiLCJpc3MiOiJub3QgdXNlZCBmbyBtcyIsImVtYWlsIjoibm90IHVzZWQgZm8gbXMiLCJ0eXBlIjoiYXV0aG1zIiwiZW5hYmxlZCI6dHJ1ZSwiZXhwIjoxNzg0NzI3MzU5MjU5fQ.YYzZ7GcQVBQhvHkEU0T2pOs0Uk4gIt6l-wGRfNgsM6M";

var authUrl = "http://localhost:3005";


function decodeToken(token)
{
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


exports.decodeToken  = decodeToken;
