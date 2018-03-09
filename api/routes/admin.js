var express = require('express');
var extend = require('util')._extend;
var router = express.Router();
var _ = require('underscore')._;
var au = require('audoku');
var Promise = require('bluebird');
var User = require('../models/users').User;
var Product = require('../models/products').Product;
var tu = require('../util/token');
var uu = require('../util/users');
var _ = require('underscore')._;

var multer = require('multer');
var fs = require('fs');
var path = require('path');


// creo una copia di joi in modo da poterla promisificare 
// // senza intaccare quella usata negli altri file
var Joi = _.extend({}, require('joi'));
Joi.validate = Promise.promisify(Joi.validate, Joi);

router.get('/admin/users',
  au.doku({
    "descritpion" : "Returns the list of users that meet the criteria ",
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
      },
      "type": 
      {
        "description": 'Search criteria to limit user type (customer, supplier, admin)',
        "type": 'string', 
        "required": false
      },
      "email": 
      {
        "description": 'Search criteria to limit user email address. Can be partial',
        "type": 'string', 
        "required": false
      },
    },
    "headers":
    {
      "Authorization":
      {
        "description": "The admin token preceded by the word 'Bearer '",
        "type": "string",
        "required": true
      }
    }
  }),
  function(req, res)
  {
    var token = req.token;
    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }
      else
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        return err;
      }

      var opt = 
      {
        page: req.query.page,
        limit: req.query.limit
      };
    
      var query = {};

      if(req.query.email)
        query.email = { "$regex": req.query.email, "$options": "i" }

      if(req.query.type)
        query.type = req.query.type


      //return User.paginate({"email": { "$regex": email, "$options": "i" }}, opt);
      return User.paginate(query, opt);
    }).then(function(result)
    {
      res.send(result);
    }).catch(function(err)
    {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(result.body);
      }
      else
      {
        return res.boom.badImplementation(err);
      }
    });
  });


router.get('/admin/users/:uid',
  au.doku({
    "descritpion" : "Return the profile of the specified user",
    "params":
    {
      "id":
      {
        "description": 'The id of the user to get',
        "type": 'string',
        "required": true
      }
    },
    "headers":
    {
      "Authorization":
      {
        "description": "The admin token preceded by the word 'Bearer '",
        "type": "string",
        "required": true
      }
    }
  }),
  function(req, res)
  {
    var uid = req.params.uid.toString();
    var token = req.token;
    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }
      else
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        return err;
      }


      //var query = {"_id": require("mongoose").Types.ObjectId(uid)};
      return User.findById(uid);
    }).then(function(result)
    {
      if (_.isEmpty(result))
        res.boom.notFound('No entry with uid ' + uid); // Error 404
      else
        res.send(result);  // HTTP 200 ok

      //res.send(result.docs);
    }).catch(function(err)
    {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(result.body);
      }
      else
      {
        return res.boom.badImplementation(err);
      }
    });
  });


router.get('/admin/users/actions/email/:email',
  au.doku({
    "descritpion" : "Return the profiles of the users that contains the specified string into email address",
    "params":
    {
      "email":
      {
        "description": 'The string to search inside email addresses',
        "type": 'string',
        "required": true
      }
    },
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
    },
    "headers":
    {
      "Authorization":
      {
        "description": "The admin token preceded by the word 'Bearer '",
        "type": "string",
        "required": true
      }
    }
  }),
  function(req, res)
  {
    var email;
    if(req.params.email)
      email = req.params.email.toString();
    else
      return res.boom.badRequest("Missing email string");

    var token = req.token;
    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }
      else
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        return err;
      }
      var opt = 
      {
        page: req.query.page,
        limit: req.query.limit
      };


      //var query = {"_id": require("mongoose").Types.ObjectId(uid)};
      return User.paginate({"email": { "$regex": email, "$options": "i" }}, opt);
    }).then(function(result)
    {
      if (_.isEmpty(result))
        res.boom.notFound('No entry with uid ' + uid); // Error 404
      else
        res.send(result);  // HTTP 200 ok

      //res.send(result.docs);
    }).catch(function(err)
    {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(result.body);
      }
      else
      {
        return res.boom.badImplementation(err);
      }
    });
  });


router.post('/admin/users',
  au.doku({
    "descritpion" : "Create a new user",
    "fields":
    {
      "name":
      {
        "description": 'The name of the user to create',
        "type": 'string',
        "required": true
      },
      "email":
      {
        "description": 'The email of the user to create',
        "type": 'string',
        "required": true
      },
      "password":
      {
        "description": 'The password of the user to create',
        "type": 'string',
        "required": 'true'
      },
      "type":
      {
        "description": 'The type of the user to create (admin, customer or supplier)',
        "type": 'string',
        "required": true
      }
    },
    "headers":
    {
      "Authorization":
      {
        "description": "The admin token preceded by the word 'Bearer '",
        "type": "string",
        "required": true
      }
    }
  }),
  function(req, res)
  {
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;
    var type = req.body.type;

    if(!name || name.trim() == "")
      return res.boom.badRequest("Missing name");

    var obj = {
      "email": email,
      "type": type,
      "name": name
    }

    var umsRet;

    var token = req.token;

    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }
      else
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        return err;
      }

      uu.register(email, password, type, token).then(function(result)
      {
        umsRet = result.body;

        if(result.response.statusCode == 201)
        {
          obj["_id"] = require("mongoose").Types.ObjectId(result.body["created_resource"]["_id"]);        
          obj["id"] = obj["_id"];        
          return User.create(obj);
        }
        else
        {
          var err = new Error();
          err.result = result;
          throw err;
        }

      }).then(function(result)
      {
        return res.status(201).send(umsRet);      
      }).catch(function(err)
      {
        console.log(err);
        try
        {
          if(err.result)
          {
            return res.status(err.result.response.statusCode).send(err.result.body);        
          }

          if(err.cause && err.cause.details[0].type)
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
    });
  });



router.delete('/admin/users/:id',
  au.doku({
    "descritpion" : "Delete a user",
    "params":
    {
      "id":
      {
        "description": 'The id of the user to delete',
        "type": 'string',
        "required": true
      }
    },
    "headers":
    {
      "Authorization":
      {
        "description": "The admin token preceded by the word 'Bearer '",
        "type": "string",
        "required": true
      }
    }
  }),
  function(req, res)
  {
    var id = req.params.id;

    var token = req.token;
    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    var resDel;
    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }
      else
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        return err;
      }

      tu.deleteUser(id, token).then(function(result)
      {
        resDel = result.body;
        if(result.response.statusCode == 204)
        {
          return User.findOneAndRemove({_id: id});
        }
        else
        {
          var err = new Error();
          err.result = result;
          throw err;
        }



        return res.status(result.response.statusCode).send(result.body);
      }).then(function(result){
        return res.status(204).send(resDel);         
      }).catch(function(err)
      { 

        console.log(err);
        try
        {
          if(err.result)
          {
            return res.status(err.result.response.statusCode).send(err.result.body);
          }

          if(err.cause && err.cause.details[0].type)
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
    });
  });

router.post('/admin/users/:id/actions/disable',
  au.doku({
    "descritpion" : "Disable a user",
    "params":
    {
      "id":
      {
        "description": 'The id of the user to disable',
        "type": 'string',
        "required": true
      }
    },
    "headers":
    {
      "Authorization":
      {
        "description": "The admin token preceded by the word 'Bearer '",
        "type": "string",
        "required": true
      }
    }
  }),
  function(req, res)
  {
    var id = req.params.id;

    var token = req.token;
    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }
      else
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        return err;
      }

      tu.disableUser(id, token).then(function(result)
      {
        return res.status(result.response.statusCode).send(result.body);
      }).catch(function(err)
      {  
        try
        {
          if(err.cause.details[0].type)
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
    });
  });

router.post('/admin/users/:id/actions/enable',
  au.doku({
    "descritpion" : "Enable a user",
    "params":
    {
      "id":
      {
        "description": 'The id of the user to disable',
        "type": 'string',
        "required": true
      }
    },
    "headers":
    {
      "Authorization":
      {
        "description": "The admin token preceded by the word 'Bearer '",
        "type": "string",
        "required": true
      }
    }
  }),
  function(req, res)
  {
    var id = req.params.id;

    var token = req.token;
    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }
      else
      {
        var err = new Error();
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        return err;
      }

      tu.enableUser(id, token).then(function(result)
      {
        return res.status(result.response.statusCode).send(result.body);
      }).catch(function(err)
      {  
        try
        {
          if(err.cause.details[0].type)
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
    });
  });


router.put('/admin/users',
  au.doku({  // json documentation
    "descritpion" : "Edit the profile of specified user",
    "title": 'Update an user profile',
    "group": "Admin",
    "version": "1.0.0",
    "name": "AdminUpdateProfile",
    "headers":
    {
      "Authorization":
      {
        "description": "The admin token preceded by the word 'Bearer '",
        "type": "string",
        "required": true
      }
    },
    "bodyFields":
    {
      "uid": 
      {
        "description": "the id of the account you want to edit",
        "type": "string",
        "required": true
      },
      "user": 
      {
        "description": 'The object that contains the user information',
        "type": 'object', 
        "required": true
      },
      "user.name": 
      {
        "description": 'The user name',
        "type": 'string', 
        "required": false
      },
      "user.address": 
      {
        "description": 'The user\'s address (only for suppliers)',
        "type": 'string', 
        "required": false
      },
      "user.phone": 
      {
        "description": 'The user\' phone number',
        "type": 'integer', 
        "required": false
      },
      "user.description": 
      {
        "description": 'The business description (only for suppliers)',
        "type": 'string', 
        "required": false
      },
      "user.web": 
      {
        "description": 'URL of user\'s website (only for suppliers)',
        "type": 'string', 
        "required": false
      },
      "user.favoriteSupplier":
      {
        "description": 'The list of the user\'s favorite supplier (only for customers)',
        // TODO tipo list al posto di string
        "type": 'string', 
        "required": false
      },
      "user.references.name":
      {
        "decription": "The first name of the account's referent",
        "type": "string",
        "required": false
      },
      "user.references.surname":
      {
        "description": "The last name of the account's referent",
        "type": "string",
        "required": false
      },
      "user.pIva":
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
  function(req, res)
  {
    var userId = req.body.uid;
    var token = req.token;

    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }

      var query = 
      {
        id: userId
      }

      return User.findOne(query).lean().exec();
    }).then(function(result)
    {

      if(result.length == 0)
      {
        throw new Error("This user does not exists");
      }
      var uType = result.type; 


      var schemaOpt =
      {
        name: Joi.string().min(3),
        address: Joi.string().min(3),
        phone: Joi.number(),
        references: Joi.object().keys({name: Joi.string(), surname: Joi.string()})
      };


      if(uType === "customer")
      {
        schemaOpt.favoriteSuppliers = Joi.array().items(Joi.string());
      }
      else if(uType === "supplier")
      {
        schemaOpt.description = Joi.string();
        schemaOpt.web = Joi.string().uri();
        schemaOpt.pIva = Joi.number();
      }

      var schema = Joi.object().keys(schemaOpt);
      return Joi.validate(req.body.user, schema);
    }).then(function(result)
    {
      var query = {"_id": require("mongoose").Types.ObjectId(userId)};
      return User.findOneAndUpdate(query, req.body.user).exec();
    }).then(function(result)
    {
      return res.status(200).send(result);
    }).catch(function(err)
    {
      console.log(err);
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err.message);
      }
      else
      {
        return res.boom.badImplementation(err);
      }
    });
  });

// DELETE
router.delete('/admin/products/:id',
  au.doku({  // json documentation
    title: 'Delete a product by id',
    version: '1.0.0',
    name: 'AdminDeleteProduct',
    group: 'Admin',
    description: 'Delete a product by id',
    params: {
      id: {type: 'String', required: true, description: 'The product identifier'}
    }
  }),
  function (req, res) 
  {
    var id = req.params.id;

    var token = req.token;

    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }

      return Product.findOneAndRemove({_id: id});
    }).then(function (entities) 
    {     
      if (_.isEmpty(entities))
        res.boom.notFound('No entry with id ' + id); // Error 404
      else
        res.send(entities);  // HTTP 200 ok
    }).catch(function (err) {
      console.log(err);
      if (err.name === 'ValidationError')
        res.boom.badData(err.message); // Error 422
      else if (err.name === 'CastError')
        res.boom.badData('Id malformed'); // Error 422
      else
        res.boom.badImplementation(err);// Error 500
    });
  });


// UPDATE
router.put('/admin/products/:id',
  au.doku({  // json documentation
    title: 'Update a product by id',
    version: '1.0.0',
    name: 'AdminUpdateProduct',
    group: 'Admin',
    description: 'Update a product by id',
    params: {
      id: {type: 'String', required: true, description: 'The product identifier'}
    },
    bodyFields: {
      name: {type: 'String', required: true, description: 'Name of product'},
      description: {type: 'String', required: true, description: 'Description of product'},
      deliveryIn: {type: 'integer', required: true, description: 'Number of days required for delivery '},
      unit: {type: 'String', required: true, description: 'Unit of measurament of the product'},
      supplierId: {type: 'ObjectId', required: true, description: 'Owner of the product [supplier Id]'},
      translation: {type: 'Array', required: true, description: 'List of information in other languages '},     
      availability: {type: 'Integer', required: true, description: 'Availability of products'},     
      maxNum: {type: 'Integer', required: true, description: 'Maximum amount that can be ordered'},     
      minNum: {type: 'Integer', required: true, description: 'Minimum amount that can be ordered'},     
      price: {type: 'Float', required: true, description: 'Price per unity'},     
      categories: {type: 'Array', required: true, description: 'Product categories'},
      images: {type: 'Array', required: false, description: 'Product images'},
      tags: {type: 'Array', required: false, description: 'Product tags'}
    }
  }),
  function (req, res) 
  {
    if (_.isEmpty(req.body))
      return res.boom.badData('Empty body'); // Error 422

    var id = req.params.id;

    var newVals = req.body; // body already parsed

    var token = req.token;

    if(token === undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid === true)
      {
        var userType = result.body.token.type;

        if(userType !== "admin")
        {
          return res.boom.forbidden("You are not authorized to perform that operation");
        }
      }

      return Product.findOneAndUpdate({_id: id}, newVals).then(function (entities) 
      {
        if (_.isEmpty(entities))
          res.boom.notFound('No entry with id ' + id); // Error 404
        else
          res.send(entities);  // HTTP 200 ok
        }).catch(function (err) 
        {
          if (err.name === 'ValidationError')
            res.boom.badData(err.message); // Error 422
          else if (err.name === 'CastError')
            res.boom.badData('Id malformed'); // Error 422
          else
            res.boom.badImplementation(err);// Error 500
        });
    });
  });
module.exports = router;


