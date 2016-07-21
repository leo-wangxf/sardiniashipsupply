var db = require('./util/db.js');
var validator = require('./util/validator.js');

exports.add = function(req, res){
  var b = req.body;
  var r = {};
  // TODO Recuperare l'id automaticamente dal token
  var userId = req.query.id;

  var catId = b.category;
  var pName = b.name;
  var pDesc = b.description;
  var pImg = b.images;

  if(pImg == undefined) pImg = [];
  if(pDesc == undefined) pDesc = "";
  if(pName == undefined) pName = "";
    

  if(!db.ObjectId.isValid(userId))
  {
    r.success = false;
    r.message = "Invalid user id";
    res.send(JSON.stringify(r));
    return;
  }

  if(!validator.validateCategory(catId, res))
    return;

  var q = db.category.find({'unspsc': catId}).lean();

  q.exec().then(function(result)
  {
    if(result.length == 0)
    {
      throw new Error("This category does not exists");
    }
  
    var catStr = catId.toString();
    var l1 = catStr.substring(0, 2);
    var l2 = catStr.substring(2, 4);
    var l3 = catStr.substring(4, 6);
    var l4 = catStr.substring(6);
    
    var catList = [];
    
    if(l4 != "00")
    {
      catList.push(parseInt(l1 + "000000"));
      catList.push(parseInt(l1 + l2 + "0000"));
      catList.push(parseInt(l1 + l2 + l3 + "00"));
    }
    else if(l3 != "00")
    {
      catList.push(parseInt(l1 + "000000"));
      catList.push(parseInt(l1 + l2 + "0000"));
    }
    else if(l2 != "00")
    {
      catList.push(parseInt(l1 + "000000"));
    }

    catList.push(catId);

    var newProduct = new db.product({
      name: pName,
      description: pDesc,
      categories: catList,
      supplierId: userId,
      images: pImg
    });

    newProduct.save().then(function(doc)
    {
      r.success = true;
      res.send(JSON.stringify(r));
    }).catch(function(e)
    {
      throw e;
    });
  }).catch(function(e)
  {
    r.success = false;
    r.message = e.message;
    res.send(JSON.stringify(r));
  });   
}

exports.remove = function(req, res){
  var b = req.body;
  var r = {};
  // TODO Recuperare l'id automaticamente dal token
  var userId = req.query.id;
  var productId = req.params.product;
 
  if(!db.ObjectId.isValid(userId))
  {
    r.success = false;
    r.message = "Invalid user id";
    res.send(JSON.stringify(r));
    return;
  }

  if(!db.ObjectId.isValid(productId))
  {
    r.success = false;
    r.message = "Invalid product id";
    res.send(JSON.stringify(r));
    return;
  }

  var optDel = {
    '_id': db.ObjectId(productId),
    'supplierId' : db.ObjectId(userId)
  };

  var q = db.product.find(optDel).limit(1).lean();

  q.exec().then(function(result)
  {
    if(result.length == 0)
    {
      throw new Error("Product not found for the selected user");
    }
   
    return db.product.remove(optDel).exec();
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

exports.modify = function(req, res){
  var b = req.body;
  var r = {};
  // TODO Recuperare l'id automaticamente dal token
  var userId = req.query.id;
  var productId = b.productId; 
  var name = b.name;
  var description = b.description;
  var images = b.images;

  if(!db.ObjectId.isValid(userId))
  {
    r.success = false;
    r.message = "Invalid user id";
    res.send(JSON.stringify(r));
    return;
  }

  if(!db.ObjectId.isValid(productId))
  {
    r.success = false;
    r.message = "Invalid product id";
    res.send(JSON.stringify(r));
    return;
  }

  var optUpdate = {
    '_id': db.ObjectId(productId),
    'supplierId' : db.ObjectId(userId)
  };

  var q = db.product.find(optUpdate).limit(1);

  q.exec().then(function(product)
  {
    if(product.length == 0)
    {
      throw new Error("Product not found for the selected user");
    }

    if(name != undefined) product[0].name = name;
    if(description != undefined) product[0].description = description;
    if(images != undefined && images instanceof Array) product[0].images = images;

    return product[0].save();
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

exports.list = function(req, res){
  var b = req.body;
  var r = {};

  var userId = req.params.user;

  if(!db.ObjectId.isValid(userId))
  {
    r.success = false;
    r.message = "Invalid user id";
    res.send(JSON.stringify(r));
    return;
  }

  var optList = {
    'supplierId' : db.ObjectId(userId)
  };

  var q = db.product.find(optList).lean();

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

