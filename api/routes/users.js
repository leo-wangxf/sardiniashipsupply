var express = require('express');
var router = express.Router();
var _ = require('underscore')._;
var au = require('audoku');
var User = require('../models/users').User;
var tu = require('../util/token');

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
    /*
    var token = req.token;        
    tu.decodeToken(token).then(function(result)
    {
      if(result.response.statusCode == 200 && result.body.valid == true)
      {
        // Continua
        var userId = 
            
        return res.send(result.body);
      }
      else
      {
        return res.status(result.respone.statusCode).send(result.body);
      }

    }).catch(function(error)
    {
      return res.boom.badImplementation(error);// Error 500
    });
    */
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
      res.send(result.docs)
    }).catch(function(err)
    {
      return res.boom.badImplementation(err); // Error 500
    });
});


/* GET users listing. */
/*
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/




module.exports = router;
