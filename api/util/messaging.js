var config = require('../config/default.json');
var Promise = require('bluebird');
var request = require('request');
var _ = require('underscore')._;

function sendMessage(room, sender, text, aux)
{
  let b = {};
  b.text = text;
  b.sender = sender;
  b.room = room;

  if(aux)
    b.aux = aux;

  var options =
  {
    url: config.messagingMsUrl + "/message", 
    method: 'POST',
    json: true,
    body: b,
    headers:
    {
      'Authorization': 'Bearer ' + config.messagingMsToken
    }
  }

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

function getMessages(ids)
{
  var s = "";


  var options =
  {
    url: config.messagingMsUrl + "/messages", 
    method: 'GET',
    qs: {id: ids},
    qsStringifyOptions: {arrayFormat: "repeat"},
    headers:
    {
      'Authorization': 'Bearer ' + config.messagingMsToken
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


function mergeMessagesTexts(messages)
{
  try
  {
    messages = messages.toObject();
  }
  catch(ee){
  }

  var msgIdList = [];
  if(Array.isArray(messages))
  {
    for(var i in messages)
    {
      if(messages[i].msgId)
      {
        msgIdList.push(messages[i].msgId.toString());
      }
    }
  }
  else
  {
    try
    {
      msgIdList.push(messages.msgId.toString());
    }
    catch(ex)
    {
    }
  }
  
  return new Promise(function(resolve, reject)
  { 
    return getMessages(msgIdList).then(function(results)
    {
      var b = results.body;
      var msgText = {};
      for(var i in b)
      {
        try
        {          
          msgText[b[i]["_id"].toString()] = b[i]["text"].toString();
        }
        catch(ex)
        {
        }
      }
     
      if(Array.isArray(messages))
      {
        for(var i in messages)
        {
          var mid = messages[i].msgId;
          if(mid && msgText[mid])
          {
            messages[i].text = msgText[mid.toString()];            
          }
        }
      }
      else
      {
        var mid = messages.msgId;
        if(mid && msgText[mid])
        {
          messages.text = msgText[mid];
        }        
      }
      return resolve(messages);
    }).catch(function(err){
      return reject(err);
    });
  });
}



exports.sendMessage  = sendMessage;
exports.getMessage  = getMessages;
exports.mergeMessagesTexts  = mergeMessagesTexts;
