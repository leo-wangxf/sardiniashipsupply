const SMS = require('node-sms-send')
const config = require('propertiesmanager').conf;

const sms = new SMS(config.smsUsername, config.smsPassword);


function sendSMS(phoneNumber, message)
{
  return sms.send(phoneNumber, message, "Smart", "Sender");
}

exports.send = sendSMS;

