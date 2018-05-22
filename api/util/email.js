var querystring = require('querystring');
var https = require('https');
var config = require('propertiesmanager').conf;
var Promise = require('bluebird');
var request = require('request');


function sendMail(to, subject, bodyText, bodyHtml, from, fromName) 
{
  var b = {
    "to": [to],
    "subject": subject,
    "from" : {}
  }

  if(bodyText) 
    b.textBody  = bodyText;

  /*
  if(bodyHtml)
    b.htmlBody = bodyHtml.replace(/"/g, '\\"');
  */

  if(bodyHtml)
    b.htmlBody = bodyHtml;



  if(from)
  {
    b.from.address = from;
  }
  else
  {
    b.from.address = "cport2020@gmail.com"
  }

  if(fromName)
  {
    b.from.name = fromName;
  }
  else
  {
    b.from.name = "Sardinia Ship Supply";
  }


  if(!config.mailerMsUrl.endsWith("/"))
    config.mailerMsUrl += "/";

  // Object of options.
  var options = {
    url: config.mailerMsUrl + 'email',
    method: 'POST',
    json: true,
    body :  b,
    headers:
    {
      'Authorization': 'Bearer ' + config.mailerMsToken
    }
  };

  //console.log(options);

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


function sendMailOld(to, subject, bodyText, bodyHtml, from, fromName) 
{

  // Make sure to add your username and api_key below.
  var opts = {
    'username' : config.emailUsername,
    'api_key': config.emailApiKey,
    'to' : to,
    'subject' : subject,
    'isTransactional': false
  }

  if(bodyText)
    opts["body_text"] = bodyText;
  
  if(bodyHtml)
    opts["body_html"] = bodyHtml;

  if(from)
    opts["from"] = from;
  else
    opts["from"] = config.emailFromAddress;
 
  if(fromName)
    opts["from_name"] = fromName;

  var postData = querystring.stringify(opts);

  // Object of options.
  var postOptions = {
    host: 'api.elasticemail.com',
    path: '/mailer/send',
    port: '443',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };

  return new Promise(function(resolve, reject)
  {
    // skip dev test 
    if(to.endsWith(".loc"))
    {
      return resolve("skip send to " + to);
    } 

    // Create the request object.
    var postReq = https.request(postOptions, function(res) 
    {
      res.setEncoding('utf8');
      res.on('data', function (chunk) 
      {      
        return resolve(chunk);
      });

      res.on('error', function (err) 
      {
        return reject(err);
      });
    });

    // Post to Elastic Email
    postReq.write(postData);
    postReq.end();
  });
}


exports.sendMail  = sendMail;
