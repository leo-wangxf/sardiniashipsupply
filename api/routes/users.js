var express = require('express');
var extend = require('util')._extend;
var router = express.Router();
var _ = require('underscore')._;
var au = require('audoku');
var Promise = require('bluebird');
var User = require('../models/users').User;
var tu = require('../util/token');

var multer = require('multer');
var fs = require('fs');
var path = require('path');

var conf = {
  uploadDir: __dirname + "/../upload",
  uploadQuota: 100 * 1024 * 1024,
  uploadFileSizeLimit: 10 * 1024 * 1024
};


fs.mkdirParentSync = function(dirPath, mode) {
  //Call the standard fs.mkdir
  try
  {
    fs.mkdirSync(dirPath, mode)
  }
  catch(error)
  {
    //When it fail in this way, do the custom steps
    if (error && error.code === 'ENOENT') 
    {
      //Create all the parents recursively
      fs.mkdirParentSync(path.dirname(dirPath), mode);
      //And then the directory
      fs.mkdirParentSync(dirPath, mode);
    }
  };
};




// creo una copia di joi in modo da poterla promisificare 
// senza intaccare quella usata negli altri file
var Joi = _.extend({}, require('joi'));
Joi.validate = Promise.promisify(Joi.validate, Joi);

// Private
function du(dir)
{
  var total = 0;
  try
  {
    var files;
    try
    {
      files = fs.readdirSync(dir);
    }
    catch(err2)
    {
      fs.mkdirParentSync(dir);
      files = fs.readdirSync(dir);
    }

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
    var userId = req.p_userId;

    var dir = path.join(conf.uploadDir, userId)

    try
    {
      var stats = fs.statSync(dir);
    }
    catch(e)
    {
      fs.mkdirParentSync(dir);
    }

    cb(null, dir);
  },
  filename: function(req, file, cb)
  {
    //cb(null, file.fieldname);
    cb(null, file.originalname.replace(/[^a-z0-9.-]/gi, "_"));
  }
});


router.get('/users',
  au.doku({  // json documentation
    "description": 'Get the list of all suppliers',
    "title": 'Get the list of all suppliers',
    "group": "Users",
    "version": "1.0.0",
    "name": "GetSuppliers",
    "fields": 
    {
      "page": 
      {
        "description": 'The current page for pagination',
        "type": 'integer', 
        "required": false
      },
      "limit": 
      {
        "description": 'The current limit for pagination',
        "type": 'integer', 
        "required": false
      }
    }
  }),
  function (req, res) {
    //if (query.hasOwnProperty('page')) delete query.page;
    //if (query.hasOwnProperty('limit')) delete query.limit;
        
    var query = {"type" : "supplier"};
    var options = {
      select: "_id name description address email logo certification pIva",
      page: req.query.page,
      limit: req.query.limit
    };

    User.paginate(query, options).then(function(result)
    {
      res.send(result.docs);
    }).catch(function(err)
    {
      return res.boom.badImplementation(err); // Error 500
    });
});


router.put('/users',
  au.doku({  // json documentation
    "description": 'Update the user profile',
    "title": 'Update the user profile',
    "group": "Users",
    "version": "1.0.0",
    "name": "UpdateProfile",
    "bodyFields": 
    {
      "name": 
      {
        "description": 'The user name',
        "type": 'string', 
        "required": false
      },
      "address": 
      {
        "description": 'The user\'s address (only for suppliers)',
        "type": 'string', 
        "required": false
      },
      "logo": 
      {
        "description": 'The url of the user\'s logo (only for suppliers)',
        "type": 'string', 
        "required": false
      },
      "phone": 
      {
        "description": 'The user\' phone number',
        "type": 'integer', 
        "required": false
      },
      "description": 
      {
        "description": 'The business description (only for suppliers)',
        "type": 'string', 
        "required": false
      },
      "web": 
      {
        "description": 'URL of user\'s website (only for suppliers)',
        "type": 'string', 
        "required": false
      },
      "favoriteSupplier":
      {
        "description": 'The list of the user\'s favorite supplier (only for customers)',
        // TODO tipo list al posto di string
        "type": 'string', 
        "required": false
      },
      "certifications":
      {
        "description": 'The list of the user\'s certifications (only for suppliers)',
        // TODO tipo object al posto di string
        "type": 'string', 
        "required": false
      },
      "categories":
      {
        "description": 'categories provided by the user (only for suppliers)',
        // TODO tipo list al posto di string
        "type": 'string', 
        "required": false
      },
      "pIva":
      {
        "description": 'The user\'s VAT identification number (only for suppliers)',
        "type": 'string', 
        "required": false
      }
    },
    "headers" :
    {
      "Authorization" :
      {
        "description" : "The user token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      }
    }
  }),
  function (req, res) {
   
    var userToken = req.token;
    var userVals;
    var userId;

    //console.log(userToken);
    if(userToken === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid == true)
      {
        userId = result.body.token._id;
        var userType = result.body.token.type;

        userVals = req.body.user;

        var schemaOpt = 
        {
          name: Joi.string().alphanum().min(3),
          address: Joi.string().min(3),
          phone: Joi.number()
        };

        if(userType === "customer")
        {
          schemaOpt.favoriteSuppliers = Joi.array().items(Joi.string());
        }
        else if(userType === "supplier")
        {
          schemaOpt.logo = Joi.string().uri();
          schemaOpt.description = Joi.string();
          schemaOpt.web = Joi.string().uri();
          schemaOpt.categories = Joi.array().items(Joi.number());
          schemaOpt.pIva = Joi.number();
        }

        var schema = Joi.object().keys(schemaOpt);

        return Joi.validate(userVals, schema);
      }
      else
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        return err;
      }
    }).then(function(done)
    {
      return tu.editUser(userId, userToken, req.body);
    }).then(function(result)
    {
      return res.status(result.response.statusCode).send(result.body);
    }).catch(function(err)
    {
      try
      {
        if(err.cause.details[0].type == 'object.allowUnknown')
        {
          return res.boom.badRequest(err.cause.details[0].message);
        }
      }catch(e2){console.log(e2)};

      if(err.statusCode)
      {
        return res.status(err.statusCode).send(result.body);
      }
      else
      {
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);


router.get('/users/actions/favorites',
  au.doku({  // json documentation
    "description" : "Get the customer's favorites suppliers list",
    "title": "Get the customer's favorites suppliers list",
    "group": "Users",
    "version": "1.0.0",
    "name": "GetFavorites",
    "headers" :
    {
      "Authorization" :
      {
        "description" : "The customer token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      }
    }
  }),
  function (req, res) {
    var userToken = req.token;
    var userVals;
    var userId;

    //console.log(userToken);
    if(userToken == undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid == true)
      {
        userId = result.body.token._id;
        var userType = result.body.token.type;

        if(userType != "customer")
        {
          return res.boom.forbidden("Only customers can use this function");
        }

        var query = {
          'id' : userId
        };

        return User.find(query, "favoriteSupplier -_id").exec();
        //var q = User.find(query, "favoriteSupplier").lean();
        //return q.exec();
      }
      else
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        return err;
      }
    }).then(function(result)
    {
      return res.send(result);
    }).catch(function(err)
    {
      console.log(err);
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(result.body);
      }
      else
      {
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);

router.post('/users/actions/favorites',
  au.doku({  // json documentation
    "description": "Add a supplier to the customer's favorites list",
    "title": "Add a supplier to the customer's favorites list",
    "group": "Users",
    "version": "1.0.0",
    "name": "PostFavorites",
    "headers":
    {
      "Authorization":
      {
        "description" : "The customer token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      }
    },
    "bodyFields": 
    {
      "supplier": 
      {
        "description" : 'The supplier to add to list',
        "type": 'string', 
        "required": true
      },
    }
  }),
  function (req, res) {
   
    var userToken = req.token;
    var userVals;
    var userId;
    var supList;

    if(userToken == undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      if(userType != "customer")
      {
        return res.boom.forbidden("Only customers can use this function");
      }

      var supData = req.body.supplier;
      if(_.isArray(supData))
      {
        supList = supData;
      }
      else
      {
        supList = [supData];
      }

      // Guardo se tutti i supplier passati esistono
      return Promise.reduce(supList, function(searchResult, supplier)
      {
        if(!require("mongoose").Types.ObjectId.isValid(supplier))
        {
            searchResult.status = false;
            // ha senso creare una llista apposita?
            searchResult.missing.push(supplier);
            return searchResult;
        }
        else
        {  
          // Cerco il singolo supplier dell'iterazione
          return User.count({_id: supplier, type: "supplier"}).exec().then(function(count)
          {
            if(count > 0)
            {
              searchResult.status = (searchResult.status && true);              
            }
            else
            {
              searchResult.status = false;
              searchResult.missing.push(supplier);
            }
            return searchResult;
          });
        }
      }, {"status" : true, "missing" : []});
    }).then(function(result)
    {
      if(result.status == false)
      {
        var e = new Error;
        e.message = "Some suppliers are unknown (" + result.missing.toString() + ")";
        e.statusCode = 400;
        throw e;
      };

      var query = 
      {
        id: userId,
        type: "customer",
      };

      var fields = "favoriteSupplier";

      return User.find(query, fields).limit(1).lean().exec();
    }).then(function(result)
    {

      // Guardo se qualche supplier e' gia' presente nella lista dei preferiti
      for(var i in supList)
      {        
        if(result[0].favoriteSupplier.indexOf(supList[i]) > -1)
        {
          // Errore o elimino il supplier da aggiungere nella lista?
          var er = new Error;
          er.message = "Supplier " + supList[i] + " is already present";
          er.statusCode = 400;
          throw er;
        }
      }

      var query = {id: userId};
      var update = {$push: {favoriteSupplier : {$each: supList}}};

      // Aggiungi i supplier alla lista
      return User.findOneAndUpdate(query, update, {safe:true, new:true}).exec();
    }).then(function(result)
    {
      if(result == null)
      {
        var er = new Error;
        er.message = "INTERNAL SERVER ERROR (user not found)";
        er.statusCode = 500;
        throw er;
      }
      else
      {
        return res.send(result);
      }
    }).catch(function(err)
    {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err);
      }
      else
      {
        console.log(err);
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);


router.delete('/users/actions/favorites/:supId',
  au.doku({  // json documentation
    "description" : "Remove a supplier from the customer's favorites list",
    "title": "Remove a supplier from the customer's favorite's list",
    "group": "Users",
    "version": "1.0.0",
    "name": "DeleteFavorite",
    "params": 
    {
      "supId":
      {
        "description" : "The id of the supplier you want to remove to your favorites",
        "type" : "string",
        "required" : true
      }
    },
    "headers":
    {
      "Authorization":
      {
        "description" : "The customer token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      }
    }
  }),
  function (req, res) {
   
    var userToken = req.token;
    var userVals;
    var userId;
    var supList;

    if(userToken == undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      if(userType != "customer")
      {
        return res.boom.forbidden("Only customers can use this function");
      }

      supId = req.params.supId

      var query = {id: userId};
      var update = {$pull: {favoriteSupplier : supId}};

      // Rimuovi il supplier dalla lista
      return User.findOneAndUpdate(query, update, {safe:true, new:true}).exec();
    }).then(function(result)
    {
      if(result == null)
      {
        var er = new Error;
        er.message = "INTERNAL SERVER ERROR (user not found)";
        er.statusCode = 500;
        throw er;
      }
      else
      {
        return res.send(result);
      }
    }).catch(function(err)
    {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err);
      }
      else
      {
        console.log(err);
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);


router.post('/users/actions/attachment',
  au.doku({  // json documentation
    "description": "Allow supplier to upload a pdf document in his own profile",
    "title": 'Allow supplier to upload a pdf document in his own profile',
    "group": "Users",
    "version": "1.0.0",
    "name": "PostAttachment",
    "headers":
    {
      "Authorization":
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      },
      "Content-Type" :
      {
        "description" : "Must be \"multipart/form-data\"",
        "type" : "string",
        "required" : "true"
      }
    }
  }),
  function (req, res) {
    var uploader = multer({
      storage: storage,
      limits: {fileSize: conf.uploadFileSizeLimit},
      fileFilter: function(req, file, cb)
      {
        userId = req.p_userId;
        var dir = path.join(conf.uploadDir, userId)

        //console.log(file.mimetype);

        if(du(dir) > conf.uploadQuota)
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

    var userToken = req.token;

    if(userToken == undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      if(userType != "supplier")
      {
        return res.boom.forbidden("Only suppliers can use this function");
      }

      
      req.p_userId = userId;

      uploader(req, res, function(err)
      {
        var r = {} 
        if(err)
        {
          r.success = false;
          r.message = err.message;
          return res.send(JSON.stringify(r));
        }

        if(req.diskQuotaExceeded)
        {
          r.success = false;
          r.message = "Disk quota exceeded";
          return res.send(JSON.stringify(r));
        }
        else if(req.wrongFileType)
        {
          r.success = false;
          r.message = "You can upload only pdf files";
          return res.send(JSON.stringify(r));
        }

        r.success = true;
        res.send(JSON.stringify(r));
      });
    }).catch(function(err)
    {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err);
      }
      else
      {
        console.log(err);
        return res.boom.badImplementation(err); // Error 500
      }
    });

  }
);

router.get('/users/actions/attachment/:supId',
  au.doku({  // json documentation
    "description": "Get the supplier's attached document list",
    "title": "Get the supplier's attached document list",
    "group": "Users",
    "version": "1.0.0",
    "name": "GetAttachments",
    "params": 
    {
      "supId":
      {
        "description" : "The id of the supplier you want to show documents",
        "type" : "string",
        "required" : true
      }
    }
  }),
  function (req, res) {
    var supId = req.params.supId;

    var dir = path.join(conf.uploadDir, supId)
    var r = {}

    var fList = [];
    fs.readdir(dir, function(err, items)
    {
      if(err)
      {
        if(err.code === "ENOENT")
        {
          r.success = true;
          r.files = [];
          return res.send(JSON.stringify(r));
        }
        else
        {
          r.success = false;
          r.message = err;
          return res.send(JSON.stringify(r));        
        }
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
);


router.get('/users/actions/attachment/:supId/:file',
  au.doku({  // json documentation
    "description": "Download a document attached by a supplier",
    "title": 'Download a document attached by a supplier',
    "group": "Users",
    "version": "1.0.0",
    "name": "DownloadAttachment",
    "params": 
    {
      "supId":
      {
        "description" : "The id of the supplier who own the file to download",
        "type" : "string",
        "required" : true
      },
      "file": 
      {
        "description": "The name of the file to download",
        "type": "string", 
        "required": true
      },

    }
  }),
  function (req, res) {
    var supId = req.params.supId;
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

    var filePath = path.join(conf.uploadDir, supId, fileName)

    res.download(filePath, function(err)
    {
      if(err)
      {
        res.status(404).send(JSON.stringify(r));
        return res.boom.notFound("File not found");
      }
      else
      {
      }
    });
  }
);


router.delete('/users/actions/attachment/:file',
  au.doku({  // json documentation
    "description": "Delete a file owned by a supplier",
    "title": 'Delete a file owned by a supplier',
    "group": "Users",
    "version": "1.0.0",
    "name": "DeleteAttachment",
    "headers":
    {
      "Authorization":
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      }
    },
    "params": 
    {
      "file": 
      {
        "description": 'The name of the file to delete.',
        "type": 'string', 
        "required": true
      },

    }
  }),
  function (req, res) {
    var userToken = req.token;
    var fileName = req.params.file;

    var r ={}

    if(userToken == undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      if(userType != "supplier")
      {
        return res.boom.forbidden("Only suppliers can use this function");
      }

      fileName = fileName.replace(/[^a-z0-9.-]/gi, "_");

      var filePath = path.join(conf.uploadDir, userId, fileName);

      fs.exists(filePath, function(exists)
      {
        if(exists)
        {
          fs.unlink(filePath, function(err)
          {
            if(err)
            {
              res.boom.badImplementation(err.message)
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
          res.boom.notFound("File doesn't exist");
        }
      });
    }).catch(function(err)
    {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err);
      }
      else
      {
        console.log(err);
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);



/* GET users listing. */
/*
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/




module.exports = router;
