var express = require('express');
var au = require('audoku');
var config = require('propertiesmanager').conf;
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
    urls.authMsUrl = config.authMsUrl;
    urls.uploadMsUrl = config.uploadMsUrl;
    urls.messagingMsUrl = config.messagingMsUrl;
    urls.trendsMsUrl = config.trendsMsUrl;
    
    res.header("Content-Type",'application/json');
    return res.end(JSON.stringify(urls));
  }
  
);


module.exports = router;
