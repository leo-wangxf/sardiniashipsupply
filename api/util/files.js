var config = require('propertiesmanager').conf;
var Promise = require('bluebird');
var request = require('request');
var multiparty = require('multiparty');
var FormData = require('form-data');
var fs = require('fs');
var magic = require('stream-mmmagic');
var fs = require("fs");

function getFile(fid, tag)
{
 // console.log(config.uploadMsUrl + "/" + fid + ((tag != undefined) ? ("?tag=" + tag) : ""));
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

function deleteFile(iid, token)
{
  var options =
  {
    url: config.uploadMsUrl + "/" + iid,
    methods: 'DELETE', 
    headers:
    {
      'Authorization': 'Bearer ' + token
      //'Authorization': 'Bearer ' + config.uploadMsToken
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


function uploadFile_old(req, res, token)
{
  var options =
  {
    url: config.uploadMsUrl,
    method: "POST",
    headers:
    {
      //'Authorization': 'Bearer ' + config.uploadMsToken,
      'Authorization': 'Bearer ' + token,
      "transfer-encoding": "chunked"
    }
  }
  var form = new multiparty.Form();

  return new Promise(function(resolve, reject)
  {

    var r = request.post(options, function(error, response, body)
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
        magic(part, function (err, mime, output) 
        {
          if (err) throw err;

          //console.log('TYPE:', mime.type);
          //console.log('ENCODING:', mime.encoding);
          //console.log('NAME:', part.filename);
          fd.append(part.name, output, {filename: part.filename});
        });

      }
    });

    form.parse(req);
  });
}


function uploadFile_old2(req, allowedMime, token)
{
  var options =
  {
    url: config.uploadMsUrl,
    method: "POST",
    headers:
    {
      //'Authorization': 'Bearer ' + config.uploadMsToken,
      'Authorization': 'Bearer ' + token,
      "transfer-encoding": "chunked"
    }
  }
  var form = new multiparty.Form();
  var parameters = {};

  return new Promise(function(resolve, reject)
  {

    var r = request.post(options, function(error, response, body)
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
        r.response = response;
        r.parameters = parameters;
        return resolve(r);
      }
      catch(error)
      {
        return error;
      }
    });

    var fd = r.form();

    form.on('error', function(error) 
    {
      const decodeError = new Error();
      decodeError.message = error.message;
      decodeError.stack = error.stack;
      return reject(decodeError);
    }); 

    form.on('part', function(part) 
    {     
      if(part.filename)
      {
        if(allowedMime == undefined)
          {
            fd.append(part.name, part, {filename: part.filename});
            parameters.fileName = part.filename;
          }
        else
        {
          magic(part, function (err, mime, output) 
          {
            if (err) return reject(err);

            var allowed = false;

            
            for(var i in allowedMime)
            { 
              if(allowedMime[i].indexOf("/") > -1)
              {                
                // check if strings are equals (ignore case)
                var re = new RegExp("^" + allowedMime[i] + "$", "i");
                console.log(mime.type);
                if(re.test(mime.type))
                {
                  allowed = true;
                  break;
                }             
              }
              else
              { 
                // check if  mime.type starts with allowedMime[i] (ignore case)
                // fastest method
                var re = new RegExp("^" + allowedMime[i], "i");
                if(re.test(mime.type))
                {
                  allowed = true;
                  break;
                }
              }
            }

            if(allowed)
            {
              fd.append(part.name, output, {filename: part.filename});
              parameters.fileName = part.filename;
            }
            else
            {
              const decodeError = new Error();
              decodeError.statusCode = 400
              decodeError.message = "Mime type " + mime.type + " is not allowed";
              return reject(decodeError);
            }
          });
        }
        
      }
    });

    form.parse(req);
  });
}



function uploadFile(req, allowedMime, token, expectedFiles)
{
  var options =
  {
    url: config.uploadMsUrl,
    method: "POST",
    headers:
    {
      //'Authorization': 'Bearer ' + config.uploadMsToken,
      'Authorization': 'Bearer ' + token,
      "transfer-encoding": "chunked"
    }
  }
  var form = new multiparty.Form();
  var parameters = {};
  var fd2 = new FormData();
  var count = 0;

  return new Promise(function(resolve, reject)
  {

    form.on('error', function(error) 
    {
      const decodeError = new Error();
      decodeError.message = error.message;
      decodeError.stack = error.stack;
      return reject(decodeError);
    }); 


    form.on('part', function(part) 
    {   
      if(part.filename)
      {
        magic(part, function (err, mime, output) 
        {            
          if (err) return reject(err);

          options.headers["content-type"] = mime;

          var allowed = false;

          if(allowedMime)
          {
            for(var i in allowedMime)
            {  
              if(allowedMime[i].indexOf("/") > -1)
              {                
              // check if strings are equals (ignore case)
                var re = new RegExp("^" + allowedMime[i] + "$", "i");
                console.log(mime.type);
                if(re.test(mime.type))
                {
                  allowed = true;
                  break;
                }             
              }
              else
              { 
                // check if  mime.type starts with allowedMime[i] (ignore case)
                // fastest method
                var re = new RegExp("^" + allowedMime[i], "i");
                if(re.test(mime.type))
                {
                  allowed = true;
                  break;
                }
              }
            }          
          }
          else
          {
            allowed = true;
          }

          if(allowed)
          {
            fd2.append(part.name, output, {filename: part.filename});
            parameters.fileName = part.filename;
            count++;
            

            if(! expectedFiles || (count === expectedFiles))
            {   
              //options.formData = fd2;
              var r = request.post(options, function(error, response, body)
              {
                if(error)
                {
                  const decodeError = new Error();
                  decodeError.message = error.message;
                  decodeError.stack = error.stack;
                  return reject(decodeError);
                }
                var rs = {};
                try
                {
                  rs.body = JSON.parse(body);
                  rs.response = response;
                  rs.parameters = parameters;
                  return resolve(rs);
                }
                catch(error)
                {
                  return error;
                }
              });
              r._form = fd2;
            }  

          }
          else
          {
            const decodeError = new Error();
            decodeError.statusCode = 400
            decodeError.message = "Mime type " + mime.type + " is not allowed";
            return reject(decodeError);
          }
        });
      }
    });

    form.parse(req);
  });
}



exports.deleteFile  = deleteFile;
exports.getFile  = getFile;
exports.uploadFile  = uploadFile;
