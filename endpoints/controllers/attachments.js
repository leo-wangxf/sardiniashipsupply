var config = require('./util/config.js');

var multer = require('multer');
var fs = require('fs');
var path = require('path');

function du(dir)
{
  var total = 0;
  try
  {
    var files = fs.readdirSync(dir);
    for(var i in files)
    {
      total += fs.statSync(path.join(dir, files[i])).size
    }
  }
  catch(err)
  {
    console.log(err);
  }
  return total;
}

var storage = multer.diskStorage(
{
  destination: function(req, file, cb)
  {
    // TODO Recuperare l'id automaticamente dal token
    var userId = parseInt(req.query.id);

    var dir = path.join(config.uploadDir, userId.toString())

    try
    {
      var stats = fs.statSync(dir);
    }
    catch(e)
    {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: function(req, file, cb)
  {
    //cb(null, file.fieldname);
    cb(null, file.originalname.replace(/[^a-z0-9.-]/gi, "_"));
  }
});

var uploader = multer({
  storage: storage,
  limits: {fileSize: config.fileSizeLimit},
  fileFilter: function(req, file, cb)
  {
    // TODO Recuperare l'id automaticamente dal token
    var userId = parseInt(req.query.id);
    var dir = path.join(config.uploadDir, userId.toString())

    console.log(file.mimetype);

    if(du(dir) > config.quotaUpload)
    {
      req.diskQuotaExceeded = true;
      return cb(null, false, new Error("Disk quota exceeded"));
    }
    else if(file.mimetype != "application/pdf")
    {
      req.wrongFileType = true;
      return cb(null, false, new Error("You can upload only pdf files"));    
    }
    else
    {
      return cb(null, true);
    }
  }
}).array('document', 5);

exports.upload = function(req, res)
{
  var b = req.body;
  var r = {};
  // TODO Recuperare l'id automaticamente dal token
  var userId = parseInt(req.query.id);

  uploader(req, res, function(err)
  {
    if(err)
    {
      r.success = false;
      r.message = err.message;
      res.send(JSON.stringify(r));
      return;
    }

    if(req.diskQuotaExceeded)
    {
      r.success = false;
      r.message = "Disk quota exceeded";
      res.send(JSON.stringify(r));
      return;
    }
    else if(req.wrongFileType)
    {
      r.success = false;
      r.message = "You can upload only pdf files";
      res.send(JSON.stringify(r));
      return;
    }


    r.success = true;

    res.send(JSON.stringify(r));
  });
}

exports.list = function(req, res)
{
  var userId = parseInt(req.params.user);
 
  var dir = path.join(config.uploadDir, userId.toString())
  var r = {}

  var fList = [];
  fs.readdir(dir, function(err, items) 
  {
    if(err)
    {
      r.success = false;
      r.message = err;
      res.send(JSON.stringify(r));
      return;
    }

    for (var i=0; i<items.length; i++) 
    {
      fList.push(items[i]);
    }
    r.success = true;
    r.files = fList;

    res.send(JSON.stringify(r));    
  });
}

exports.download = function(req, res)
{
  var userId = parseInt(req.params.user);
  var fileName = req.params.file;
  var r = {};

  if(fileName == undefined)
  {
    r.success = false;
    r.message = "Missing file name";
    res.send(JSON.stringify(r));
    return;
  }

  fileName = fileName.replace(/[^a-z0-9.-]/gi, "_");

  //var filePath  = config.uploadDir + userId + "/" + fileName;
  var filePath = path.join(config.uploadDir, userId.toString(), fileName)

  res.download(filePath, function(err)
  {
    if(err)
    {
      r.success = false;
      r.message = "File not found";
      res.status(404).send(JSON.stringify(r));
    }
    else
    {
    }
  });  
}

exports.delete = function(req, res)
{
  // TODO Recuperare l'id automaticamente dal token
  var userId = parseInt(req.query.id);
  var fileName = req.params.file;
 
  var r = {}

  fileName = fileName.replace(/[^a-z0-9.-]/gi, "_");

  var filePath = path.join(config.uploadDir, userId.toString(), fileName);

  fs.exists(filePath, function(exists)
  {
    if(exists)
    {
      fs.unlink(filePath, function(err)
      {
        if(err)
        {
          r.success = false;
          r.message = err.message;
          res.send(JSON.stringify(r));
        }
        else
        {
          r.success = true;
          res.send(JSON.stringify(r));
        }
      });
    }
    else
    {
      r.success = false;
      r.message = "File doesn't exist";
      res.send(JSON.stringify(r));
    } 
  });
}
