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





/* GET users listing. */
/*
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/




module.exports = router;
