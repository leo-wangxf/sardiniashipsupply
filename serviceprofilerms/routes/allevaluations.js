var express = require('express');
var router = express.Router();
var request = require('request');
var Promise = require('bluebird');
//var _apiMsUrl = "http://seidue.crs4.it:3009/api/v1/";
var _apiMsUrl = "http://localhost:3000/api/v1/";
var qm = require('qminer');
var loader = require('qminer-data-loader');




router.get('/allevaluations',  function(req, res, next) {
  // to be called as:
  // IP_of_serviceprofilerms:3016/allevaluations
  console.log('inside router get allevaluations');
  var options =
  {
	  url: _apiMsUrl + "/synch_evaluations",
	  method: 'GET'
  };
  request.get(options, function(error, response, body)
		 {
				 if(error)
				 {
					 const decodeError = new Error();
					 decodeError.message = error.message;
					 decodeError.stack = error.stack;
					 console.log('Error message: ' + decodeError.message);
					 console.log('Error stack: ' + decodeError.stack);
					 return reject(decodeError);
				 }
				 var r = {};
				 r.body = JSON.parse(body);
				 r.response = response;
				 console.log('response:' + r.response); 
				 console.log('lenght of r body docs:' + r.body.docs); 
				 console.log('lenght of r body docs length:' + r.body.docs.length); 
				 return res.send(r);
			  });
});


module.exports = router;
