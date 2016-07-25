exports.validateId = function(id, res, str)
{ 
  var r = {};

  if(typeof(id) != "number" || isNaN(id) || id < 0)
  {
    r.success = false;
    r.message = "Invalid " + ((str != undefined) ? (str + " ") : "") + "id";
    res.send(JSON.stringify(r));  
    return false; 
  }
  else
  {
    return true;
  }  
}

exports.validateCategory = function(category, res)
{ 
  var r = {};

  if(typeof(category) != "number" || isNaN(category))
  {
    r.success = false;
    r.message = "Invalid category id";
    res.send(JSON.stringify(r));  
    return false; 
  }
  else if((category + "").length != 8)
  {
    r.success = false;
    r.message = "Category format is invalid";
    res.send(JSON.stringify(r));  
    return false; 
  }
  else
  {
    return true;
  }  
}
