var config = require('../config/default.json');
var Promise = require('bluebird');
var request = require('request');
var multiparty = require('multiparty');
var FormData = require('form-data');
var fs = require('fs');

function getFile(fid, tag)
{
  console.log(config.uploadMsUrl + "/" + fid + ((tag != undefined) ? ("?tag=" + tag) : ""));
  var options =
  {
    url: config.uploadMsUrl + "/" + fid + ((tag != undefined) ? ("?tag=" + tag) : ""),
    methods: "GET",
    encoding: null,
    headers:
    {
      'Authorization': 'Bearer ' + config.uploadMsToken
    }
  }

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
      r.body = body;
      r.response = response;
      return resolve(r);
    });
  });
}

function deleteFile(iid)
{
  var options =
  {
    url: config.uploadMsUrl + "/" + iid,
    methods: 'DELETE', 
    headers:
    {
      'Authorization': 'Bearer ' + config.uploadMsToken
    }
  }

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
      r.body = body;
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


function uploadFile(req, res)
{
  var options =
  {
    url: config.uploadMsUrl,
    method: "POST",
    headers:
    {
      'Authorization': 'Bearer ' + config.uploadMsToken,
      "transfer-encoding": "chunked"
    }
  }
  var form = new multiparty.Form();

  return new Promise(function(resolve, reject)
  {

    var r = request.post(options, function(error, response, body)
    {
      console.log("dentro request");
      if(error)
      {
        const decodeError = new Error();
        decodeError.message = error.message;
        decodeError.stack = error.stack;
        return reject(decodeError);
      }
      var r = {};
      r.body = body;
      r.response = response;
      return resolve(r);
    });

    var fd = r.form();

    form.on('error', function(err) 
    {
      const decodeError = new Error();
      decodeError.message = error.message;
      decodeError.stack = error.stack;
      return reject(decodeError);
    }); 

    form.on('end', function()
    {
      console.log("end");
    });

    form.on('part', function(part) 
    {
      if(part.filename)
      {
        console.log(part.filename);
        fd.append(part.name, part, {filename: part.filename});
      }
    });

    form.parse(req);
  });
}

exports.deleteFile  = deleteFile;
exports.getFile  = getFile;
exports.uploadFile  = uploadFile;
