var express = require('express');
var router = express.Router();
var request = require('request');
var Promise = require('bluebird');
//var _apiMsUrl = "http://seidue.crs4.it:3009/api/v1/";
var _apiMsUrl = "http://localhost:3000/api/v1/";
var qm = require('qminer');




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
				 console.log('BEFORE');

                                 var base = new qm.Base({
					 mode:'createClean',
					 schema: [{
						 name: 'Evaluations',
					         fields: [{name:'_id', type:'string',primary:true},
						          {name:'overall_review',type:'string', null:true},
						          {name:'from', type:'string', null:true},
						          {name:'to', type:'string', null:true},
						          {name:'conversationId', type:'string', null:true},
						          {name:'evaluation_time', type:'string', null:true},
						          {name:'price_value_rate', type:'int', null:true},
						          {name:'custom_service_rate', type:'int', null:true},
						          {name:'product_rate', type:'int', null:true},
						          {name:'delivery_rate', type:'int', null:true},
						          {name:'overall_rate', type:'int', null:true},
						 ],


					 }]});
				 for(var i in r.body) {
			            console.log('r body ' + i + ' \n' +JSON.stringify(r.body[i]));
				    base.store('Evaluations').push(r.body[i]);
				 }
				 console.log('base store 0' + base.store('Evaluations')[0]);
				 base.close();




				 r.response = response;
				 console.log('response:' + r.response); 
				 console.log('AFTER');
				 return res.send(r);
			  });
});


module.exports = router;
