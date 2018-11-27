//const SMS = require('node-sms-send')
const SMS = require('./comilio_nostro')
const config = require('propertiesmanager').conf;

const sms = new SMS(config.smsUsername, config.smsPassword);


function sendSMS(phoneNumber, message)
{
  return sms.send(phoneNumber, message, "Smart", "+393313106278");
}

exports.send = sendSMS;

