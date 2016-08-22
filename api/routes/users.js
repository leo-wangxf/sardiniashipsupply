var express = require('express');
var extend = require('util')._extend;
var router = express.Router();
var _ = require('underscore')._;
var au = require('audoku');
var Promise = require('bluebird');
var User = require('../models/users').User;
var tu = require('../util/token');

// creo una copia di joi in modo da poterla promisificare 
// senza intaccare quella usata negli altri file
var Joi = _.extend({}, require('joi'));
Joi.validate = Promise.promisify(Joi.validate, Joi);

router.get('/',
  au.doku({  // json documentation
    description: 'Get the list of all suppliers',
    fields: 
    {
      page: 
      {
        description: 'The current page for pagination',
        type: 'integer', required: false
      },
      limit: 
      {
        description: 'The current limit for pagination',
        type: 'integer', required: false
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


router.put('/',
  au.doku({  // json documentation
    description: 'Update the user profile',
    fields: 
    {
      name: 
      {
        description: 'The user name',
        type: 'string', required: false
      },
      address: 
      {
        description: 'The user\'s address (only for suppliers)',
        type: 'string', required: false
      },
      logo: 
      {
        description: 'The url of the user\'s logo (only for suppliers)',
        type: 'string', required: false
      },
      phone: 
      {
        description: 'The user\' phone number',
        type: 'integer', required: false
      },
      description: 
      {
        description: 'The business description (only for suppliers)',
        type: 'string', required: false
      },
      web: 
      {
        description: 'URL of user\'s website (only for suppliers)',
        type: 'string', required: false
      },
      favoriteSupplier:
      {
        description: 'The list of the user\'s favorite supplier (only for customers)',
        // TODO tipo list al posto di string
        type: 'string', required: false
      },
      certifications:
      {
        description: 'The list of the user\'s certifications (only for suppliers)',
        // TODO tipo object al posto di string
        type: 'string', required: false
      },
      categories:
      {
        description: 'categories provided by the user (only for suppliers)',
        // TODO tipo list al posto di string
        type: 'string', required: false
      },
      pIva:
      {
        description: 'The user\'s VAT identification number (only for suppliers)',
        type: 'string', required: false
      }
    }
  }),
  function (req, res) {
   
    var userToken = req.token;
    var userVals;
    var userId;

    console.log(userToken);
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


router.get('/actions/favorites',
  au.doku({  // json documentation
    description: "Get the customer's favorites suppliers list",
    fields: 
    {
    }
  }),
  function (req, res) {
   
    var userToken = req.token;
    var userVals;
    var userId;

    console.log(userToken);
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

        return User.paginate(query, {page: req.query.page, limit: req.query.limit, fields: "favoriteSupplier"});
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

router.post('/actions/favorites',
  au.doku({  // json documentation
    description: "Add a supplier to the customer's favorites list",
    fields: 
    {
      supplier: 
      {
        description: 'The supplier to add to list',
        type: 'string', required: true
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
      return User.findOneAndUpdate(query, update, {safe:true}).exec();
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



router.delete('/actions/favorites/:supId',
  au.doku({  // json documentation
    description: "Remove a supplier from the customer's favorites list",
    fields: 
    {
      supplier: 
      {
        description: 'The supplier to remove from the list',
        type: 'string', required: true
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

      supId = req.params.supId

      var query = {id: userId};
      var update = {$pull: {favoriteSupplier : supId}};

      // Rimuovi il supplier dalla lista
      return User.findOneAndUpdate(query, update, {safe:true}).exec();
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




/* GET users listing. */
/*
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/




module.exports = router;
