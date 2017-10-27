var express = require('express');
var au = require('audoku');
var config = require('../config/default.json');
var router = express.Router();
var tokenMiddleware = require('../util/middlewares').tokenMiddleware;


router.get('/sys/urls',
  au.doku({  // json documentation
    "description": 'Retrieve the list of microservice URLs used by Sardinia Ship Supply',
    "title": 'Get Microservices URl',
    "group": "Sys",
    "version": "1.0.0",
    "name": "GetMsUrls",
  }),
  function (req, res) {
    let urls = {};
    urls.authMs = config.authMsUrl;
    urls.uploadMs = config.uploadMsUrl;
    urls.messagingMs = config.messagingMsUrl;
    
    res.header("Content-Type",'application/json');
    return res.end(JSON.stringify(urls));
  }
  
);


module.exports = router;
