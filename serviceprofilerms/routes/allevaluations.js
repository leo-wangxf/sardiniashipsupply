var express = require('express');
var router = express.Router();
var request = require('request');
var Promise = require('bluebird');
var Users = require('../models/users').User;
//var _apiMsUrl = "http://seidue.crs4.it:3009/api/v1/";
var _apiMsUrl = "http://localhost:3000/api/v1/";
var qm = require('qminer');

// to be called as:
// IP_of_serviceprofilerms:3016/allevaluations/all
// because in app.js there are 
// var allevaluations = require('./routes/allevaluations');
// app.use('/allevaluations', allevaluations); // the first part of the path
// while in this file there is /all  which is the last part of the path



router.get('/all',  function(req, res, next) {
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
				 // r.body.doc is used by paginator, here no paginator is used ...
				 r.body = JSON.parse(body);
				 console.log('BEFORE');
                                 // the following is the schema definition
				 // for _id primary: true is required
				 // for all the fields null:true allows records without
				 // that particular fields (can be the case of old records, for instance)
                                 var base = new qm.Base({
					 mode:'createClean',
					 schema: [{
						 name: 'Evaluations',
					         fields: [{name:'_id', type:'string',primary:true},
						          {name:'overall_review',type:'string', null:true},
						          {name:'conversationId', type:'string', null:true},
						          {name:'evaluation_time', type:'string', null:true},
						          {name:'price_value_rate', type:'int', null:true},
						          {name:'custom_service_rate', type:'int', null:true},
						          {name:'product_rate', type:'int', null:true},
						          {name:'delivery_rate', type:'int', null:true},
						          {name:'overall_rate', type:'int', null:true},
						 ]
					 },{
						 name:'Supplier',
					         fields: [{name:'_id', type:'string',primary:true},
						         {name:'name', type:'string'},
						         {name:'categories', type: 'string_v', null: true}, // array of categories
						         {name:'certifications', type: 'json', null: true}, // array of objects made of name and description
						 ]
					 },{
						 name:'Customer',
					         fields: [{name:'_id', type:'string',primary:true},
						         {name:'name', type:'string'},
						 ]
					 }]
				 });

				 Users.find({}).lean().exec().then(function( users) {
					 console.log('error after find: ' + error);
					 //console.log('users after find: ' + users);
					 for (var j in users) {
						 users[j]._id = users[j]._id.toString();
						 if (users[j].type == 'customer') {
						 base.store('Customer').push(users[j]);
						 
						 } else {
						 base.store('Supplier').push(users[j]);
						}
					 };
					 console.log('base store Customer 0: ' + base.store('Customer')[0]);
					 console.log('base store Supplier 0: ' + base.store('Supplier')[0]);
				 return users;
				 }).then( function(result) {
					 
				 // to store the data in the qminer db, a push of each records is necessary
				 // so it is convenient to store all the records using push inside a loop
				 
				 for(var i in r.body) {
			            //console.log('r body ' + i + ' \n' +JSON.stringify(r.body[i]));
				    base.store('Evaluations').push(r.body[i]);
				 }
				 console.log('base store 0: ' + base.store('Evaluations')[0]);
				 console.log(base.store('Evaluations')[0]);
				 console.log('base store 100 overall_rate = ' + base.store('Evaluations')[0].overall_rate);
				 
				 base.close();
				 r.response = response;
				 console.log('response:' + r.response); 
				 console.log('AFTER');
				 return res.send(r);

                                 });


			  });
});


module.exports = router;
