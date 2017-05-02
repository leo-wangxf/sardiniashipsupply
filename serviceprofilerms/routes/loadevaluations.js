var express = require('express');
var router = express.Router();
var request = require('request');
var Promise = require('bluebird');
//var _apiMsUrl = "http://seidue.crs4.it:3009/api/v1/";
var _apiMsUrl = "http://localhost:3000/api/v1/";


// to be called as
// http://localhost:3016/loadevaluations
// in app js there are the following 2 lines
// var loadevaluations = require('./routes/loadevaluations');
// ...
// app.use('/loadevaluations', loadevaluations);



router.get('/',  function(req, res, next) {
  console.log('inside router get loadevaluations');
  var options =
  {
	  url: _apiMsUrl + "/evaluations",
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
		 console.log('response: '+ r.response);
		 console.log('length of r body docs: ' + r.body.docs.length);
		 console.log('body total: ' + r.body.total);
		 console.log('body limit: ' + r.body.limit);
		 console.log('body page: ' + r.body.page);
		 console.log('body pages: ' + r.body.pages);
		 return res.send(r);
	  });
});


module.exports = router;
