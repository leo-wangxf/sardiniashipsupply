var db = require('./util/db.js');
var validator = require('./util/validator.js');
var regexp_quote = require("regexp-quote");

exports.list = function(req, res){
  var b = req.body;
  var page = req.params.page
  var limit = 50;

  var r = {};

  if(page == undefined)
  {
    page = 1;
  }

  var skip = (page - 1) * limit;

  var q = db.user.find({}, "_id type name email").limit(limit).skip(skip).lean();
  q.exec().then(function(doc)
  {
    r.success = true;
    r.data = doc;
    res.send(JSON.stringify(r));
  }).catch(function(e)
  {
    r.success = false;
    r.message = e.message;
    res.send(JSON.stringify(r));
  });
}

exports.getCategories = function(req, res){
  var b = req.body;
  var id = req.params.id;

  var r ={};

  if(!db.ObjectId.isValid(id))
  {
    r.success = false;
    r.message = "Invalid id";
    res.send(JSON.stringify(r));
    return;
  }

  var q = db.product.find({'supplierId': db.ObjectId(id)},  { '_id': 0, 'categories' : 1}).lean();

  q.exec().then(function(result)
  {
    var cat = [];
    for(var i in result) {cat.push(result[i].categories)};
    var merged = [].concat.apply([], cat);
    var categories = merged.filter(function(elem, pos)
    {
      return merged.indexOf(elem) == pos;
    });

    r.success = true;
    r.data = categories;
    res.send(JSON.stringify(r));
  }).catch(function(e)
  {
    r.success = false;
    r.message = e.message;
    res.send(JSON.stringify(r));
  });
}

exports.search = function(req, res){
  var b = req.body;
  var r = new Object();
  var cat = parseInt(req.params.category);
  var product = req.query.product;

  if(!validator.validateCategory(cat, res))
    return;

  var q;
  
  if(product == undefined)
  {
    q = db.product.find({"categories": cat}, {
      '_id': 0,
      'supplierId' : 1,}).lean();
  }
  else
  {
    //var rexp = "/" + regexp_quote(product) + "/";   

   q = db.product.find(
     {$text: {$search: product}, "categories": cat},
     {score: {$meta: "textScore"},
      '_id': 0, 
      'supplierId' : 1,
    }).sort({score:{$meta: "textScore"}}).lean();

/*
    q = db.product.find({$or: 
                          [
                            {"name" : new RegExp(product, "ig")},
                            {"description" : new RegExp(product, "ig")}
                          ],
                          "categories": cat
                        }).distinct("supplierId");  
*/
  }

  q.exec().then(function(result)
  {
    var si = [];

    for(var i in result){
      si.push(result[i].supplierId + "");
    }

    var  sid = si.filter(function(elem, pos, self)
    { 
      return self.indexOf(elem) == pos;
    });

    return db.user.find({"_id" : {"$in" : sid}}, { '_id': 0, 'password' : 0}).lean().exec();
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

