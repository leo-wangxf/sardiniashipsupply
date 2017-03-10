var express = require('express');
var extend = require('util')._extend;
var router = express.Router();
var _ = require('underscore')._;
var au = require('audoku');
var Promise = require('bluebird');
var multer = require('multer');
//var tu = require('../util/token');
var tokenMiddleware = require('../util/middlewares').tokenMiddleware;
var fu = require('../util/files');
var Product = require('../models/products').Product;
var User = require('../models/users').User;


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


router.post('/files/actions/attachments',[tokenMiddleware,
  au.doku({  // json documentation
    "description": 'Allow suppliers  to upload an attachment to server',
    "title": 'Upload Attachment',
    "group": "Files",
    "version": "1.0.0",
    "name": "PostFileAttachment",
    "params": 
    {
    }
  })],
  function(req, res) {
    res.setHeader("Content-Type", "application/json");

    var userType = req.user.type;

    if(userType != "supplier")
    {
      return res.boom.forbidden("Only suppliers can use this function");
    }

    fu.uploadFile(req, ["application/pdf", "application/x-pdf"]).then(function(result)
    {
      if(result.response.statusCode == 200)
      {
        var fileId = result.body["filecode"];
        var userId = req.user.id;
        var query = {_id: require("mongoose").Types.ObjectId(userId)};
        var fileName = result.parameters.fileName;
        var update = {"$push" : {"attachments.files": {"id": fileId, "name" : fileName}}};

        return User.findOneAndUpdate(query, update, {safe: true, new: true}).lean().exec();
      }
      else
      {
        var err = new Error(result.body.message);
        err.message = result.body.message;
        err.statusCode = result.response.statusCode;
        throw err;
      }
     
    }).then(function(result)
    {
      //console.log(result);

      return res.end(result.body);
    }).catch(function(err)
    {
      console.log(err);
      if(err.statusCode)
      {
        var r = {message: err.message};
        return res.status(err.statusCode).send(r);
      }
      else
      {
        return res.boom.badImplementation(JSON.stringify(err)); // Error 500
      }
    });
  }

);


router.get('/files/attachments/:sid',
  au.doku({  // json documentation
    "description": 'Retrieve the attachment list of a supplier',
    "title": 'Get Attachment',
    "group": "Files",
    "version": "1.0.0",
    "name": "GetFileAttachmentList",
    "params": 
    {
    }
  }),
  function(req, res) { 
    res.setHeader("Content-Type", "application/json");

    var sid = req.params.sid;

    var query = {_id: require("mongoose").Types.ObjectId(sid)};
    User.findOne(query, {"attachments.files" : 1}).lean().exec().then(function(result)
    {
      return res.send(result);
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

    fu.uploadFile(req, ["image"]).then(function(result)
    {
      if(result.response.statusCode == 200)
      {
        return res.end(JSON.stringify(result.body));
      }
      else
      {
        var err = new Error("");
        err.message = result.body.message;
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

// DELETE attachment
router.delete('/files/actions/attachment/:fid',[tokenMiddleware,
  au.doku({  // json documentation
    title: 'Delete a supplier\'s attachment',
    version: '1.0.0',
    name: 'DeleteAttachment',
    group: 'Files',
    description: 'Delete a supplier\'s attachments',
    params: {
        fid: {type: 'String', required: true, description: 'The file identifier'}
    }
  })],
  function (req, res) {
    var fid = req.params.fid;

    var supId = require("mongoose").Types.ObjectId(req.user.id);
    var update = {"$pull" : {"attachments.files": {"id": fid}}};

    User.findOneAndUpdate({_id: supId, "attachments.files":{$elemMatch: {id: fid}}}, update).lean().exec().then(function (entities) {
      if (_.isEmpty(entities))
      {
        var err = new Error("");
        err.message = "Entry not founded";
        err.statusCode = 404;
        throw err;
      }

      return fu.deleteFile(fid);
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
        console.log(err);
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

