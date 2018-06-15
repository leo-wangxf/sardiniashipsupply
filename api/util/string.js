var math = require('mathjs');

function randomString(length, charset)
{
  var lower = "abcdefghijklmnopqrstuvwxyz";
  var upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var number = "0123456789";
  var special = "!$%^&*()_+|~-=`{}[]:;<>?,./";

  var dic = "";
  var ret = "";

  if(!charset)
  {
    dic = lower + upper + number + special;
  }
  else
  {
    if(charset.indexOf("l") > -1)
      dic += lower
    if(charset.indexOf("u") > -1)
      dic += upper
    if(charset.indexOf("n") > -1)
      dic += number
    if(charset.indexOf("s") > -1)
      dic += special
  }

  if(dic == "")
  {
    dic = lower + upper + number + special;
  }


  for (var i = 1; i <= length; i++) 
  {
    var idx = Math.floor(Math.random() * dic.length);    
    ret += dic.substring(idx, idx + 1);
  }

  return ret;



}

exports.randomString = randomString;

