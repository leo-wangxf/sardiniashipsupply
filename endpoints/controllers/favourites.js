var db = require('./util/db.js');
var validator = require('./util/validator.js');

exports.list = function(req, res){
  // TODO Recuperare l'id automaticamente dal token
  var userId = req.query.id;

  var r = {};


  if(!db.ObjectId.isValid(userId))
  {
    r.success = false;
    r.message = "Invalid user id";
    res.send(JSON.stringify(r));
    return;
  }

  var optList = {
    '_id' : db.ObjectId(userId)
  };

  var q = db.user.find(optList, "favoriteSupplier").lean();

  var p = q.exec();
  p.then(function(result)
  {
    return db.user.find({"_id" : {"$in" :result}}).lean().exec();    
  }).then(function(result)
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

exports.add = function(req, res){
  var b = req.body;
  // TODO Recuperare l'id automaticamente dal token
  var customerId = req.query.id + "";
  var supplierId = b.supplier;

  var r = {};
  var con;

  if(!db.ObjectId.isValid(customerId))
  {
    r.success = false;
    r.message = "Invalid user id";
    res.send(JSON.stringify(r));
    return;
  }

  if(!db.ObjectId.isValid(supplierId))
  {
    r.success = false;
    r.message = "Invalid supplier id";
    res.send(JSON.stringify(r));
    return;
  }

 
  var q = db.user.find({"_id" : db.ObjectId(supplierId), "type": 2}).lean();
  
  q.exec().then(function(result)
  {
    if(result.length == 0)
    {
      throw new Error('Supplier is unknown');
    }

    return db.user.find({"_id" : db.ObjectId(customerId)}).limit(1).exec();
  }).then(function(result)
  {
    if(result.length == 0)
    {
      throw new Error('Customer not found. Who are you?');
    }

    if(result[0].favoriteSupplier.indexOf(db.ObjectId(supplierId)) >= 0)
    {
      throw new Error('This supplier si already in your favourites list');
    }
 
    result[0].favoriteSupplier.push(db.ObjectId(supplierId));

    return result[0].save();
  }).then(function(result)
  {
    r.success = true;
    res.send(JSON.stringify(r));
  }).catch(function(e)
  {
    r.success = false;
    r.message = e.message;

    res.send(JSON.stringify(r));
  });
}

exports.remove = function(req, res){
  var b = req.body;
  // TODO Recuperare l'id automaticamente dal token
  var customerId = req.query.id;
  var supplierId = req.params.supplier;

  var r = {};
  var con;

  if(!db.ObjectId.isValid(customerId))
  {
    r.success = false;
    r.message = "Invalid user id";
    res.send(JSON.stringify(r));
    return;
  }

  if(!db.ObjectId.isValid(supplierId))
  {
    r.success = false;
    r.message = "Invalid supplier id";
    res.send(JSON.stringify(r));
    return;
  }

  var q = db.user.update({"_id" : db.ObjectId(customerId)}, {$pullAll: {"favoriteSupplier" : [db.ObjectId(supplierId)]}});

  q.then(function(result)
  { 
    r.success = true;
    res.send(JSON.stringify(r));    
  }).catch(function(e)
  {
    r.success = false;
    r.message = e.message;

    res.send(JSON.stringify(r));
  });
}
