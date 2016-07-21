var m = require('./util/db2.js');
var validator = require('./util/validator.js');

var i = 0;

exports.test = function(req, res){
  var b = req.body;
  var r = {};

  var myModel = undefined;
  try
  {    
    myModel = m.model("myModel");
  }
  catch(err)
  {
    if(err.name = "MissingSchemaError")
    {
      var mySchema = m.schema({
        campo1: String,
        campo2: String,
        campo3: Number,
        campo4: Number
      }); 
      myModel = m.model("myModel", mySchema);
    }
  }

  var c1 = new myModel({
    campo1: "questo e' il primo campo",
    campo3: 3
  });

  c1.save().then(function(doc)
  {
    //console.log(doc);

    return "valore restituito";  
  }).then(function(ret)
  {
    var c2 = new myModel({
      campo1: "questo e' il primo campo",
      campo2: "questo e' il secondo campo",
      campo3: 3,
      campo4: 4
    });

    c2.save().then(function(doc)
    {
      var q = myModel.find({}).lean();
      q.exec().then(function(doc)
      {
        //console.log(doc);
      }).catch(function(err)
      {
        console.log("ERROR 1" + err)        
      });
      console.log("end " + (i++));
      
    }) 
  }).catch(function(err)
  {
    console.log("ERROR " + err)
  });

  var r = {};
  
  r.success = true;
  r.message = "OK";
  res.send(JSON.stringify(r));     
}

