var express = require('express');
var extend = require('util')._extend;
var router = express.Router();
var _ = require('underscore')._;
var formidable = require('formidable');
var au = require('audoku');
var Promise = require('bluebird');
var multer = require('multer');
//var tu = require('../util/token');
var tokenMiddleware = require('../util/middlewares').tokenMiddleware;
var fu = require('../util/files');
var Product = require('../models/products').Product;


// creo una copia di joi in modo da poterla promisificare 
// senza intaccare quella usata negli altri file
var Joi = _.extend({}, require('joi'));
Joi.validate = Promise.promisify(Joi.validate, Joi);

router.get('/files/:fid',
  au.doku({  // json documentation
    "description": 'Get a file',
    "title": 'retrieve a file',
    "group": "Files",
    "version": "1.0.0",
    "name": "GetFile",
    "params": 
    {
      "fid":
      {
        "description" : "The id of the file you want to retrieve",
        "type" : "string",
        "required" : true
      },
      "tag":
      {
        "description" : "The tag of the file you want to retrieve",
        "type" : "string",
        "required" : false
      }
    }
  }),
  function (req, res) {
    var fid = req.params.fid;
    var tag = req.query.tag;

    fu.getFile(fid, tag).then(function(result)
    {
      if(result.response.statusCode == 200)
      {
        return res.end(new Buffer(result.body, 'binary' ));
      }
      else
      {
        var err = new Error("");
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        throw err;
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



router.post('/files',[tokenMiddleware,
  au.doku({  // json documentation
    "description": 'Upload files to server',
    "title": 'Upload File',
    "group": "Files",
    "version": "1.0.0",
    "name": "PostFile",
    "params": 
    {
    }
  })],
  function(req, res) { 
    res.setHeader("Content-Type", "application/json");

    fu.uploadFile(req, res).then(function(result)
    {
      if(result.response.statusCode == 200)
      {
        return res.end(result.body);
      }
      else
      {
        var err = new Error("");
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        throw err;
      }
    }).catch(function(err)
    {
      console.log(err);
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

// DELETE image
router.delete('/files/actions/imageproduct/:iid/:pid',[tokenMiddleware,
  au.doku({  // json documentation
    title: 'Delete a product\'s image by id',
    version: '1.0.0',
    name: 'DeleteProductImage',
    group: 'Products',
    description: 'Delete a product image\'s by id',
    params: {
        id: {type: 'String', required: true, description: 'The image identifier'}
    }
  })],
  function (req, res) {
    var pid = req.params.pid;
    var iid = req.params.iid;

    var supId = require("mongoose").Types.ObjectId(req.user.id);

    //Product.findByIdAndUpdate(id, newVals).then(function (entities) {
    Product.find({_id: pid, supplierId:  supId, images:{$elemMatch: {imageId: iid}}}).limit(1).lean().exec().then(function (entities) {
      if (_.isEmpty(entities))
      {
        var err = new Error("");
        err.message = "Entry not founded";
        err.statusCode = 404;
        throw err;
      }

      return fu.deleteFile(iid);
    }).then(function(result) {
      if(result.response.statusCode == 200)
      {
        return res.end(result.body);
      }
      else
      {
        var err = new Error("");
        err.message = result.body.error_message;
        err.statusCode = result.response.statusCode;
        throw err;
      }
    }).catch(function (err) {
      if(err.statusCode)
      {
        return res.status(err.statusCode).send(err);
      }
      else
      {
        return res.boom.badImplementation(err); // Error 500
      }
    });
  }
);



module.exports = router;

