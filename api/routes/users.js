var express = require('express');
var extend = require('util')._extend;
var router = express.Router();
var _ = require('underscore')._;
var au = require('audoku');
var Promise = require('bluebird');
var User = require('../models/users').User;
var Category = require('../models/categories').Category;
var tu = require('../util/token');
var uu = require('../util/users');
var fu = require('../util/files');
var config = require('propertiesmanager').conf;
var eu = require('../util/email');
var sms = require('../util/sms');
var strUtil = require('../util/string');

var fs = require('fs');
var path = require('path');

mailResetPasswordTitle = {};
mailResetPasswordTitle["en"] = "Reset Password";
mailResetPasswordTitle["it"] = "Ripristino Password";

mailResetPasswordBody = {};
mailResetPasswordBody["en"] = `Dear $$EMAIL$$, <br> 
  We have received a request to reset the password for your account. <br>
  To change your password, please click on the following link: <br>
  $$LINK$$  <br>
  If you did not make this request, you can ignore this message.`;

mailResetPasswordBody["it"] = `Gentile $$EMAIL$$, <br> 
  Abbiamo ricevuto una richiesta per ripristinare la password del tuo account. <br>
  Per impostre una nuova password accedi alla seguente pagina: <br>
  $$LINK$$  <br>
  Se non sei stato tu ad effettuare questa richiesta pui ignorare questo messaggio.`;

// creo una copia di joi in modo da poterla promisificare 
// senza intaccare quella usata negli altri file
var Joi = _.extend({}, require('joi'));
Joi.validate = Promise.promisify(Joi.validate, Joi);



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

    // TODO Solo per test. Da rimuovere
    if(req.query.all == "true")
    {
      query = {};
    }

    var options = {
      //select: "_id name description address email logo certification pIva",
      select: "-email -surname -phone -phoneVerificationCode -phoneVerified -address -references",
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

router.get('/users/supplier/:supId',
  au.doku({  // json documentation
    "description": 'Get the information of requested supplier',
    "title": 'Get supplier info',
    "group": "Users",
    "version": "1.0.0",
    "name": "GetSupplier",
    "params": 
    {
      "supId":
      {
        "description" : "The id of the supplier you want to retrieve information",
        "type" : "string",
        "required" : true
      }
    },
  }),
  function (req, res) {
    supId = req.params.supId    
    if(!require("mongoose").Types.ObjectId.isValid(supId))
    {
      return res.boom.badRequest("Invalid supplier id")      
    }

    var query = {
      "_id" : supId,
      "type": "supplier"           
    };


    User.find(query, "-email -surname -phone -phoneVerified -phoneVerificationCode -address -references").limit(1).exec().then(function(result)
    {
      if(result.length == 0)
      {
        return res.boom.notFound("Supplier not found");
      }
      else
      {      
        res.send(result)
      }
    }).catch(function(err)
    {
      return res.boom.badImplementation(err); // Error 500
    });
});



router.post('/users/actions/logo',
  au.doku({  // json documentation
    "description": 'Upload a user logo ',
    "title": 'Upload Logo',
    "group": "users",
    "version": "1.0.0",
    "name": "PostLogo",
    "params": 
    {
    }
  }),
  function(req, res) { 
    res.setHeader("Content-Type", "application/json");

    var userToken = req.token;
    var userVals;
    var oldLogo;
    var userId;
    var logoId;

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

        if(userType != "customer" && userType != "supplier")
        {
          return res.boom.forbidden("Only customers and suppliers can use this function");
        }

        userVals = req.body.user;
        return User.findOne({_id: require("mongoose").Types.ObjectId(userId)}).lean().exec();
        //return uu.getProfile(userId, userToken);        
      }
      else
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }
    }).then(function(result)
    {
      //fu.deleteFile(result.body.logo)
      fu.deleteFile(result.logo)

      return fu.uploadFile(req, ["image"], userToken);
    }).then(function(result)
    {

      if(result.response.statusCode == 200)
      {
        logoId = result.body.filecode;
        //return tu.editUser(userId, userToken, {"user" :{"logo" : logoId}});
        var query = {_id: require("mongoose").Types.ObjectId(userId)};
        return User.findOneAndUpdate(query, {"logo" : logoId}, {safe:true, new:true, upsert:true}).lean().exec();
      }
      else
      {
        var msg = "";
        if(result.body.message != undefined)
        {
          msg = result.body.message;
        }
        var err = new Error();
        err.message = msg;
        err.statusCode = result.response.statusCode;
        throw err;
      }
    }).then(function(result)
    {
      return res.status(200).send(result);
    }).catch(function(err)
    {
      console.log(err);
      try
      {
        if(err.cause.details[0].type)
        {
          return res.boom.badRequest(err.cause.details[0].message);
        }
      }catch(e2){console.log(e2)};

      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err.message);
      }
      else
      {
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);


router.put('/users',
  au.doku({  // json documentation
    "description": 'Update the user profile',
    "title": 'Update the user profile',
    "group": "Users",
    "version": "1.0.0",
    "name": "UpdateProfile",
    "bodyFields": 
    {
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
          name: Joi.string().min(3),
          address: Joi.string().min(3),
          phone: Joi.string(),
          references: Joi.object().keys({name: Joi.string(), surname: Joi.string()})
        };

        if(userType === "customer")
        {
          schemaOpt.favoriteSuppliers = Joi.array().items(Joi.string());
        }
        else if(userType === "supplier")
        {          
          schemaOpt.description = Joi.string();
          schemaOpt.web = Joi.string().uri().allow('');
          schemaOpt.pIva = Joi.string().regex(/^[0-9]{11}$/);
        }
        

        var schema = Joi.object().keys(schemaOpt);

        return Joi.validate(userVals, schema);
      }
      else
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }
    }).then(function(done)
    {
      return User.findById(userId).exec();

    }).then(function(doc)
    {
      var opt = req.body.user;
      if(("" + doc.phone) != ("" + opt.phone))
      {
        opt.phoneVerified = false;
      }
      var query = {"_id": require("mongoose").Types.ObjectId(userId)};
      return User.findOneAndUpdate(query, opt).exec();
      //return tu.editUser(userId, userToken, req.body);
    }).then(function(result)
    {
      return res.status(200).send(result);
    }).catch(function(err)
    {
      console.log(err);
      try
      {
        if(err.cause.details[0].type)
        {
          return res.boom.badRequest(err.cause.details[0].message);
        }
      }catch(e2){console.log(e2)};

      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err.message);
      }
      else
      {
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);


router.post('/users/signin',
  au.doku({  // json documentation
    "description": 'Sign in inside platform',
    "title": 'Sign in',
    "group": "Users",
    "version": "1.0.0",
    "name": "SignIn",
    "bodyFields": 
    {
      "email": 
      {
        "description": 'The email of the user who want access to the system',
        "type": 'string', 
        "required": true
      },
      "password": 
      {
        "description": 'The password of the user who want access to the system',
        "type": 'string', 
        "required": 'true'
      }
    }
  }),
  function (req, res) {

    var email = req.body.email;
    var password = req.body.password;
   
    uu.signIn(email, password).then(function(result)
    {
      return res.status(result.response.statusCode).send(result.body);
    }).catch(function(err)
    {
      console.log(err);
      return res.boom.badRequest(err);
    });
  }
);


router.post('/users/signup',
  au.doku({  // json documentation
    "description": 'Register a new user inside platform',
    "title": 'Sign up',
    "group": "Users",
    "version": "1.0.0",
    "name": "SignUp",
    "bodyFields": 
    {
      "name": 
      {
        "description": 'The name of the user who want register to  system',
        "type": 'string', 
        "required": true
      },
      "email": 
      {
        "description": 'The email of the user who want register to  system',
        "type": 'string', 
        "required": true
      },
      "password": 
      {
        "description": 'The password of the user who want access to  system',
        "type": 'string', 
        "required": 'true'
      },
      "type": 
      {
        "description": 'The type of the user who want register to  system (customer or supplier)',
        "type": 'string', 
        "required": true
      },
      "rfqApproval": 
      {
        "description": 'The approval to be contacted by other users (RfQ)',
        "type": 'boolean', 
        "required": true
      }
    }
  }),
  function (req, res) {

    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;
    var type = req.body.type;
    var rfqApproval = req.body.rfqApproval;

    var obj = {
      "email": email,
      "type": type,
      "name": name
    }

    var umsRet;
   
    uu.signUp(email, password, type).then(function(result)
    {
      umsRet = result.body;
      //==========================================================
      if(rfqApproval == true)
      {
        if(result.response.statusCode == 201)
        {
          obj["_id"] = require("mongoose").Types.ObjectId(result.body["created_resource"]["_id"]);        
          //obj["_id"] = require("mongoose").Types.ObjectId(result.body["userId"]);        
          obj["id"] = obj["_id"];        
          return User.create(obj);
        }
        else
        {
          var err = new Error();
          err.result = result;
          throw err;

          //return res.status(result.response.statusCode).send(result.body);        
        }
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
        return res.status(err.statusCode).send(err.message);
      }
      else
      {
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);

router.get('/users/profile/',
  au.doku({  // json documentation
    "description": 'Get user profile info',
    "title": 'Get user info',
    "group": "Users",
    "version": "1.0.0",
    "name": "getProfile",
    "params": 
    {
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

    tu.decodeToken(userToken).then(function(result)
    {

      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();

        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        err.statusCode = result.response.statusCode;
        throw err;
      }     
      else
      {
        userId = result.body.token._id;
        var userType = result.body.token.type;

        return User.findOne({_id: require("mongoose").Types.ObjectId(userId)}).lean().exec();
        //return uu.getProfile(userId, userToken);
      }
    }).then(function(result)
    {
      //return res.status(result.response.statusCode).send(result.body);
      return res.send(result);
    }).catch(function(err)
    {
      console.log(err);

      return res.boom.badImplementation(err); // Error 500
      
    });
  }
);

router.post('/users/actions/resetpassword',
  au.doku({  // json documentation
    "description": "Change the password with a reset token",
    "title": "Set new password with a reset token",
    "group": "Users",
    "version": "1.0.0",
    "name": "ResetPassword",
    "bodyFields": 
    {
      "password": 
      {
        "description" : 'The new user\'s password to save',
        "type": 'string', 
        "required": true
      },
      "resetToken": 
      {
        "description" : 'Token used to update password',
        "type": 'string', 
        "required": true
      },
      "email": 
      {
        "description" : 'Email address of the user.',
        "type": 'string', 
        "required": false
      }
    }
  }),
  function (req, res) {
    //var userToken = req.token;
    var email = req.body.email
    var password = req.body.password;
    var resetToken = req.body.resetToken;

    User.findOne({"email": email}).lean().exec().then(function(result)
    {
      if( !result || result.length == 0)
      {
        var err = new Error();
        err.message = "This email address isn't registered on our system";
        err.statusCode = 404;
        throw err;
      }
      userId = result._id;

      uu.resetPassword(result._id, password, resetToken).then(function(result)
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
          return res.status(err.statusCode).send(err.message);
        }
        else
        {
          return res.boom.badImplementation(err); // Error 500
        }
      });
    });
  }
);




router.post('/users/actions/askresetpassword',
  au.doku({  // json documentation
    "description": "Send an email with the link to reset the password",
    "title": "Ask reset password",
    "group": "Users",
    "version": "1.0.0",
    "name": "askResetPassword",
    "bodyFields": 
    {
      "email": 
      {
        "description" : 'Email of the user who need to reset pasword',
        "type": 'string', 
        "required": true
      }
    }
  }),
  function (req, res) {
   
    var email = req.body.email;
    var newPassword = req.body.newpassword;
    var userId;

    User.findOne({"email": email}).lean().exec().then(function(result)
    {
      if( !result || result.length == 0)
      {
        var err = new Error();
        err.message = "This email address isn't registered on our system";
        err.statusCode = 404;
        throw err;
      }
      userId = result._id;

      return uu.getResetPasswordToken(userId);
    }).then(function(result)
    {
      console.log(result);
      var rToken = result.body.reset_token;
      var link = config.frontendUrl + "/page_reset_password.html?token=" + rToken + "&email=" + email;

      mTitle = mailResetPasswordTitle["en"];
      mBody = mailResetPasswordBody["en"].replace("$$EMAIL$$", email).replace("$$LINK$$", link);

      console.log(link);

      var template = fs.readFileSync(__dirname + '/../util/template/email.html').toString();
      var body = template.replace("$$BODY_TITLE$$", mTitle).replace("$$BODY$$", mBody);
     

      return eu.sendMail(email, mTitle, undefined, body, undefined, "Sardinia Ship Supply");
    }).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        console.log(result.body);
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "An error has occurred during email sending. Please try again.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }

      return res.send({"success": true}); 
    }).catch(function(err)
    {
      try
      {
        if(err.cause.details[0].type)
        {
          return res.boom.badRequest(err.cause.details[0].message);
        }
      }catch(e2){};

      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err.message);
      }
      else
      {
        console.log(err);
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);




router.post('/users/actions/setpassword',
  au.doku({  // json documentation
    "description": "Change the own password",
    "title": "Set new password",
    "group": "Users",
    "version": "1.0.0",
    "name": "PostPassword",
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
      "oldPassword": 
      {
        "description" : 'The old user\'s password ',
        "type": 'string', 
        "required": true
      },
      "newPassword": 
      {
        "description" : 'The new user\'s password to save',
        "type": 'string', 
        "required": true
      }
    }
  }),
  function (req, res) {
   
    var userToken = req.token;
    var oldPassword = req.body.oldpassword;
    var newPassword = req.body.newpassword;
    var userId;

    tu.decodeToken(userToken).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
       
        err.statusCode = result.response.statusCode;
        throw err;
      }
      else
      {
        userId = result.body.token._id;
        var userType = result.body.token.type;

        return uu.changePassword(userId, userToken, oldPassword, newPassword);
      }
    }).then(function(result)
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
        return res.status(err.statusCode).send(err.message);
      }
      else
      {
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);



router.get('/users/favorites',
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
          '_id' : require("mongoose").Types.ObjectId(userId)
        };

        return User.find(query, "favoriteSupplier -_id").exec();
        //var q = User.find(query, "favoriteSupplier").lean();
        //return q.exec();
      }
      else
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
       
        err.statusCode = result.response.statusCode;
        throw err;
      }
    }).then(function(result)
    {
      var arrId = [];

      if(result[0])
      {
        for(var i in result[0].favoriteSupplier)
        {
          if(!isNaN(i))
          {
            arrId.push(require("mongoose").Types.ObjectId(result[0].favoriteSupplier[i]));
          }
        }
      }


      return User.find({'_id': {$in: arrId}}).exec();
    }).then(function(result)
    {
      return res.send(result);
    }).catch(function(err)
    {
      console.log(err);
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err.message);
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
        if(result.body.valid == false)
        {
          err.message = result.body.error_message;
        }
        else
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        
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
        _id: require("mongoose").Types.ObjectId(userId),
        type: "customer",
      };

      var fields = "favoriteSupplier";

      return User.find(query, fields).limit(1).lean().exec();
    }).then(function(result)
    {

      // Guardo se qualche supplier e' gia' presente nella lista dei preferiti
      for(var i in supList)
      {        
        if(result[0])
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
      }

      var query = {_id: require("mongoose").Types.ObjectId(userId)};
      var update = {$push: {favoriteSupplier : {$each: supList}}};

      // Aggiungi i supplier alla lista
      return User.findOneAndUpdate(query, update, {safe:true, new:true, upsert:true}).exec();
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
        return res.send(result.favoriteSupplier);
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
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
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

      var query = {_id: require("mongoose").Types.ObjectId(userId)};
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
        return res.send(result.favoriteSupplier);
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


router.get('/users/categories',
  au.doku({  // json documentation
    "description" : "Get the supplier's categories list",
    "title": "Get the suppplier's categories list",
    "group": "Users",
    "version": "1.0.0",
    "name": "GetCategories",
    "headers" :
    {
      "Authorization" :
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
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

        if(userType != "supplier")
        {
          return res.boom.forbidden("Only supplier can use this function");
        }

        var query = {
          '_id' : require("mongoose").Types.ObjectId(userId)
        };

        return User.find(query, "categories -_id").exec();
      }
      else
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }
    }).then(function(result)
    {
      var arrId = [];

      if(result[0])
      {
        for(var i in result[0].categories)
        {
          if(!isNaN(i))
          {
            arrId.push(require("mongoose").Types.ObjectId(result[0].categories[i]));
          }
        }
      }

      return Category.find({'_id': {$in: arrId}}).exec();
    }).then(function(result)
    {      
      return res.send(result);
    }).catch(function(err)
    {
      console.log(err);
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err.message);
      }
      else
      {
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);

router.post('/users/actions/categories',
  au.doku({  // json documentation
    "description": "Add a category to the supplier's list",
    "title": "Add a category to the supplier's supplier list",
    "group": "Users",
    "version": "1.0.0",
    "name": "PostCategories",
    "headers":
    {
      "Authorization":
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      }
    },
    "bodyFields": 
    {
      "category": 
      {
        "description" : 'The category to add to list',
        "type": 'string', 
        "required": true
      },
    }
  }),
  function (req, res) {
   
    var userToken = req.token;
    var userVals;
    var userId;
    var catList;

    if(userToken == undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      if(userType != "supplier")
      {
        return res.boom.forbidden("Only supplier can use this function");
      }

      var catData = req.body.category;
      if(_.isArray(catData))
      {
        catList = catData;
      }
      else
      {
        catList = [catData];
      }

      // Guardo se tutte le categorie passate esistono
      return Promise.reduce(catList, function(searchResult, category)
      {
        if(!require("mongoose").Types.ObjectId.isValid(category))
        {
            searchResult.status = false;
            // ha senso creare una lista apposita?
            searchResult.missing.push(category);
            return searchResult;
        }
        else
        {  
          // Cerco la singola categoria dell'iterazione
          return Category.count({_id: category}).exec().then(function(count)
          {
            if(count > 0)
            {
              searchResult.status = (searchResult.status && true);              
            }
            else
            {
              searchResult.status = false;
              searchResult.missing.push(category);
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
        e.message = "Some categories are unknown (" + result.missing.toString() + ")";
        e.statusCode = 400;
        throw e;
      };

      var query = 
      {
        _id: require("mongoose").Types.ObjectId(userId),
        type: "supplier",
      };

      var fields = "categories";

      return User.find(query, fields).limit(1).lean().exec();
    }).then(function(result)
    {

      // Guardo se qualche categoria e' gia' presente nella lista
      for(var i in catList)
      { 
        if(result[0])
        {       
          if(result[0].categories.indexOf(catList[i]) > -1)
          {
            // Errore o elimino il supplier da aggiungere nella lista?
            var er = new Error;
            er.message = "Category " + catList[i] + " is already present";
            er.statusCode = 400;
            throw er;
          }
        }
      }

      var query = {_id: require("mongoose").Types.ObjectId(userId)};
      var update = {$push: {categories : {$each: catList}}};

      // Aggiungi le categorie alla lista
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

router.delete('/users/actions/categories/:catId',
  au.doku({  // json documentation
    "description" : "Remove a category from the supplier's list",
    "title": "Remove a category from the supplier's list",
    "group": "Users",
    "version": "1.0.0",
    "name": "DeleteCategory",
    "params": 
    {
      "catId":
      {
        "description" : "The id of the category you want to remove to your list",
        "type" : "string",
        "required" : true
      }
    },
    "headers":
    {
      "Authorization":
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
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
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      if(userType != "supplier")
      {
        return res.boom.forbidden("Only suppliers can use this function");
      }

      catId = req.params.catId

      var query = {_id: require("mongoose").Types.ObjectId(userId)};
      var update = {$pull: {categories : catId}};

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

router.get('/users/certifications',
  au.doku({  // json documentation
    "description" : "Get the supplier's certifications list",
    "title": "Get the supplier's certifications list",
    "group": "Users",
    "version": "1.0.0",
    "name": "GetCertifications",
    "headers" :
    {
      "Authorization" :
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
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

        if(userType != "supplier")
        {
          return res.boom.forbidden("Only supplier can use this function");
        }

        var query = {
          '_id' : require("mongoose").Types.ObjectId(userId)
        };

        return User.find(query, "certifications -_id").lean().exec();
      }
      else
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }
    }).then(function(result)
    {
      var r;
      if(result[0])
        r = result[0].certifications;

      if(r == undefined)
        r = [];
      /*
      if(result.length == 1 && Object.keys(result[0]).length == 0)
        result = [];
      */
      return res.send(r);
    }).catch(function(err)
    {
      console.log(err);
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err.message);
      }
      else
      {
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);

router.post('/users/actions/certifications',
  au.doku({  // json documentation
    "description": "Add a certification to the supplier's list",
    "title": "Add a category to the supplier's supplier list",
    "group": "Users",
    "version": "1.0.0",
    "name": "PostCertifications",
    "headers":
    {
      "Authorization":
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      }
    },
    "bodyFields": 
    {
      "certification": 
      {
        "description" : 'The certification to add to list',
        "type": 'object', 
        "required": true
      },
      "certification.name":
      {
        "description": 'The certification name',
        "type": 'string',
        "required": true
      },
      "certification.date":
      {
        "description": 'The certification date',
        "type": 'string',
        "required": false
      },
      "certification.description":
      {
        "description": 'The certification description',
        "type": 'string',
        "required": false
      }
    }
  }),
  function (req, res) {
   
    var userToken = req.token;
    var userVals;
    var userId;
    var certList;
    var certData;

    if(userToken == undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      if(userType != "supplier")
      {
        return res.boom.forbidden("Only supplier can use this function");
      }

      certData = req.body.certification;

      return User.count({_id: require("mongoose").Types.ObjectId(userId), certifications: {$elemMatch: {name: certData.name}}}).exec()
    }).then(function(count)
    {
      if(count > 0)
      {
        var e = new Error;
        e.message = "This certification is already present";
        e.statusCode = 409;
        throw e;
      }
      var query = {_id: require("mongoose").Types.ObjectId(userId)};
      var update = {$push: {certifications : certData}};

      // Aggiungi la certificazione  alla lista
      return User.findOneAndUpdate(query, update, {safe:true, new:true, upsert:true}).exec();
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
        console.log(result);
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

router.delete('/users/actions/certifications/:name',
  au.doku({  // json documentation
    "description" : "Remove a certification from the supplier's list",
    "title": "Remove a certification from the supplier's list",
    "group": "Users",
    "version": "1.0.0",
    "name": "DeleteCertification",
    "params": 
    {
      "name":
      {
        "description" : "The name of the certification you want to remove to your list",
        "type" : "string",
        "required" : true
      }
    },
    "headers":
    {
      "Authorization":
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
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
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      if(userType != "supplier")
      {
        return res.boom.forbidden("Only suppliers can use this function");
      }

      certification = req.params.name

      var query = {_id: require("mongoose").Types.ObjectId(userId)};
      var update = {$pull: {certifications : {name: certification}}};

      // Rimuovi la certificazione  dalla lista
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

router.post('/users/actions/phone/verification',
  au.doku({  // json documentation
    "description": "Send a code via SMS to user's phone to verify its number",
    "title": 'Send a phone verification code',
    "group": "Users",
    "version": "1.0.0",
    "name": "phoneVerification",
    "headers":
    {
      "Authorization":
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      }
    }
  }),
  function (req, res) {
    var userToken = req.token;

    var r ={}
    var code;

    if(userToken == undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      return User.findById(userId);
    }).then(function(doc)
    {
      var email = doc.email;
      var phoneNumber = doc.phone.replace(" ", "").replace("-", "");

      // un -> uppercase + numbers
      code = strUtil.randomString(5, "un");

      User.findOneAndUpdate({"email": doc.email}, {"$set": {"phoneVerificationCode": code}}).exec();

      // TODO send SMS
      return sms.send(phoneNumber, "Sardinia Ship Supply - This is your verification code " + code); 
      //return eu.sendMail(email, "Please verify your telephone number", undefined, "This is your verification code<br>" + code, undefined, "Cagliari Port 2020");

    }).then(function(body)
    {
      console.log(body);
      /*
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        console.log(result.body);
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "An error has occurred during SMS sending. Please try again.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }
      */

      return res.send({"success": true}); 
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


router.post('/users/actions/phone/verify',
  au.doku({  // json documentation
    "description": "Check a verification code to enable a phone number",
    "title": 'Verify phone number',
    "group": "Users",
    "version": "1.0.0",
    "name": "phoneVerify",
    "bodyFields": 
    {
      "verificationCode": 
      {
        "description" : 'The verification code to verify',
        "type": 'string', 
        "required": true
      }
    },
    "headers":
    {
      "Authorization":
      {
        "description" : "The supplier token preceded by the word 'Bearer '",
        "type" : "string",
        "required" : true
      }
    }
  }),
  function (req, res) {
    var userToken = req.token;

    var r ={}
    var vCode = req.body.verificationCode;

    if(userToken == undefined)
    {
      return res.boom.forbidden("Missing token");
    }

    tu.decodeToken(userToken).then(function(result)
    {
      if(!(result.response.statusCode == 200 && result.body.valid == true))
      {
        var err = new Error();
        if(result.body.valid == false)
        {
          err.message = "User account isn't valid. Please contact an administrator.";
        }
        else
        {
          err.message = result.body.error_message;
        }
        
        err.statusCode = result.response.statusCode;
        throw err;
      }

      userId = result.body.token._id;
      var userType = result.body.token.type;

      return User.findById(userId);
    }).then(function(doc)
    {
      var email = doc.email;
      var verificationCode = doc.phoneVerificationCode;
      var verified = doc.phoneVerified;

      if(verified == true)
      {
        var err = new Error();
        err.message = "Your phone number is already verified";
        err.statusCode = 200;
        throw err;
      }

      //console.log(verificationCode);
      //console.log(vCode);
      if(verificationCode != vCode)
      {
        var err = new Error();
        err.message = "Your verification code is wrong";
        err.statusCode = 403;
        throw err;
      }

      User.findOneAndUpdate({"email": doc.email}, {"$set": {"phoneVerified": true}}).exec();

      // TODO send SMS

    }).then(function(result)
    {      
      return res.send({"success": true}); 
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
