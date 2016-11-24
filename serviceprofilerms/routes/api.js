var express = require('express');
var config = require('propertiesmanager').conf;
var router = express.Router();

var auth = require('tokenmanager');
var authField = config.decodedTokenFieldName;

auth.configure({
  authoritationMicroserviceUrl:config.authProtocol + "://" + config.authHost + ":" + config.authPort,
  decodedTokenFieldName: authField,
  access_token: config.access_token
})

//authms middleware wrapper for dev environment (no authms required)
function authWrap(req, res, next) {
  if(!req.app.get("nocheck"))
    auth.checkAuthorization(req, res, next);
  else next();
}




/* GET home page. */
router.get('/profiles/', authWrap, function(req, res, next) {
  res.render('index', { title: 'Cagliari Port 2020 Service Profiler API' });
});

module.exports = router;
