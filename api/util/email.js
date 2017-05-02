var querystring = require('querystring');
var https = require('https');
var config = require('../config/default.json');
var Promise = require('bluebird');
var request = require('request');

function sendMail(to, subject, bodyText, bodyHtml, from, fromName) 
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
