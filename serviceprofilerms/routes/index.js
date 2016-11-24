var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Cagliari Port 2020 Service Profiler API' });
});

module.exports = router;
