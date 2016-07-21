var db = require('./util/db.js');
var validator = require('./util/validator.js');

exports.list = function(req, res){
  var cat = req.params.category;

  var sCatMin = undefined;
  var sCatMax = undefined;

  if(cat != undefined)
  { 
    if(validator.validateCategory(parseInt(cat)))
    {
      var l1 = cat.substring(0, 2);
      var l2 = cat.substring(2, 4);
      var l3 = cat.substring(4, 6);
      var l4 = cat.substring(6);

      var sCatMin = "";
      var sCatMax = "";

      if(l2 == "00")
      {
        sCatMin = l1 + "000000";
        sCatMax = l1 + "999999";
      }
      else if(l3 == "00")
      { 
        sCatMin = l1 + l2 + "0000";
        sCatMax = l1 + l2 + "9999";
      }
      else if(l4 == "00")
      { 
        sCatMin = l1 + l2 + l3 + "00";
        sCatMax = l1 + l2 + l3 + "99";
      }
      else
      {
        sCatMin = l1 + l2 + l3 + l4;
        sCatMax = l1 + l2 + l3 + l4;
      }
    }
    
    var catMin = parseInt(sCatMin);
    var catMax = parseInt(sCatMax);

    if(!validator.validateCategory(catMin) || !validator.validateCategory(catMax))
    {
      catMin = undefined;    
      catMax = undefined;    
    }    
  } 

  var r = {};
  var con;


  var q = undefined;
  if(catMin == undefined || catMax == undefined)
  {
    q = db.category.find({}).lean();
  }
  else
  {
    q = db.category.find({"unspsc" : {$lte: catMax, $gte: catMin}}).lean();
  }

  q.exec().then(function(result)
  {
    r.success = true;
    r.data = result;
    res.send(JSON.stringify(r));    
  }).catch(function(e)
  {
    r.success = false;
    r.message = e.message;

    res.send(JSON.stringify(r));
  });
}

