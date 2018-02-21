var express = require('express');
var extend = require('util')._extend;
var router = express.Router();
var _ = require('underscore')._;
var au = require('audoku');
var Promise = require('bluebird');
var User = require('../models/users').User;
var tu = require('../util/token');
var uu = require('../util/users');

var multer = require('multer');
var fs = require('fs');
var path = require('path');


router.get('/admin/users',
  au.doku({
    "descritpion" : "Return the list of all users",
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

      return User.paginate({}, opt);
    }).then(function(result)
    {
      res.send(result.docs);
    }).catch(function(err)
    {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(result.body);
      }
      else
      {
        return res.boom.badImlementation(err);
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
/*
router.put('/users',
  au.doku({
    "descritpion" : "Edit the profile of specified user",
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
      "userId":
      {
        "description": "The id of the user you want to edit",
        "type": "string",
        "required" : true
      },
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
      },
      "type":
      {
        "description": 'The user\'s type (customer, supplier, admin)',
        "type": 'string', 
        "required": false
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

      var userId = req.body.user.id;
      var query = 
      {
        id: userId
      }

      return User.find(query).limit(1).lean().exec();
    }).then(function result)
    {

      if(result.length == 0)
      {
        throw new Error("This user does not exists");
      }

      
      var schemaOpt = 
      {
        name: Joi.string().alphanum().min(3),
        address: Joi.string().min(3),
        phone: Joi.number(),

        favoriteSuppliers: Joi.array().items(Joi.string()),
        logo: Joi.string().uri(),
        description: Joi.string(),
        web: Joi.string().uri(),
        categories: Joi.array().items(Joi.number()),
        pIva: Joi.number()
      };

      

      var opt = 
      {
        page: req.query.page,
        limit: req.query.limit
      };

      return User.paginate({}, opt);
    }).then(function(result)
    {
      res.send(result.docs);
    }).catch(function(err)
    {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(result.body);
      }
      else
      {
        return res.boom.badImlementation(err);
      }
    });
  });
*/
module.exports = router;


